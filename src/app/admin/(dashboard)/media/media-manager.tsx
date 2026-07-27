"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";

import {
  MEDIA_FILE_ACCEPT,
  MEDIA_MAX_BATCH_SIZE,
  MEDIA_UPLOAD_CONCURRENCY,
  mediaErrorMessage,
  uploadMediaFile,
  validateMediaFile,
} from "@/app/admin/_lib/media-upload";
import { api } from "@/trpc/react";

type UploadState = "queued" | "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  file: File;
  state: UploadState;
  message?: string;
  publicUrl?: string;
  retryable: boolean;
};

type LibraryStatus = {
  message: string;
  tone: "info" | "error";
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatDate(value: Date | string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function mediaName(key: string) {
  return key.split("/").at(-1) ?? key;
}

export function MediaManager() {
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createUpload = api.media.createUpload.useMutation();
  const deleteMedia = api.media.delete.useMutation();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [batchMessage, setBatchMessage] = useState("");
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>(
    [undefined],
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus | null>(
    null,
  );
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const cursor = cursorHistory.at(-1);
  const library = api.media.list.useQuery({ cursor });
  const uploading = uploads.some(
    (item) => item.state === "queued" || item.state === "uploading",
  );

  function updateUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function uploadOne(item: UploadItem) {
    updateUpload(item.id, {
      state: "uploading",
      message: "Sending to R2…",
      retryable: false,
    });

    try {
      const result = await uploadMediaFile(item.file, (input) =>
        createUpload.mutateAsync(input),
      );
      updateUpload(item.id, {
        state: "success",
        message: "Uploaded",
        publicUrl: result.publicUrl,
        retryable: false,
      });
    } catch (error) {
      updateUpload(item.id, {
        state: "error",
        message: mediaErrorMessage(error),
        retryable: true,
      });
    }
  }

  async function runBatch(items: UploadItem[]) {
    let nextIndex = 0;
    const workerCount = Math.min(MEDIA_UPLOAD_CONCURRENCY, items.length);

    const workers = Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        if (item) {
          await uploadOne(item);
        }
      }
    });

    await Promise.all(workers);
    await utils.media.list.invalidate();
  }

  function addFiles(fileList: FileList | File[]) {
    if (uploading) {
      setBatchMessage("Wait for the current batch before adding more files.");
      return;
    }

    const selected = Array.from(fileList);
    if (!selected.length) return;

    const limited = selected.slice(0, MEDIA_MAX_BATCH_SIZE);
    setBatchMessage(
      selected.length > MEDIA_MAX_BATCH_SIZE
        ? `Only the first ${MEDIA_MAX_BATCH_SIZE} files were added.`
        : "",
    );

    const now = Date.now();
    const newItems = limited.map<UploadItem>((file, index) => {
      try {
        validateMediaFile(file);
        return {
          id: `${now}-${index}-${file.name}`,
          file,
          state: "queued",
          message: "Waiting…",
          retryable: false,
        };
      } catch (error) {
        return {
          id: `${now}-${index}-${file.name}`,
          file,
          state: "error",
          message: mediaErrorMessage(error),
          retryable: false,
        };
      }
    });

    const validItems = newItems.filter((item) => item.state === "queued");
    setUploads((current) => [...newItems, ...current]);

    if (validItems.length) {
      void runBatch(validItems);
    }
  }

  async function copyUrl(key: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setLibraryStatus({
        message: "Public URL copied to the clipboard.",
        tone: "info",
      });
      window.setTimeout(
        () => setCopiedKey((current) => (current === key ? null : current)),
        1800,
      );
    } catch {
      setLibraryStatus({
        message: "The URL could not be copied. Copy it manually instead.",
        tone: "error",
      });
    }
  }

  async function removeMedia(key: string) {
    if (
      !window.confirm(
        `Delete “${mediaName(key)}” from R2? This cannot be undone, and copied URLs may still be used elsewhere.`,
      )
    ) {
      return;
    }

    setDeletingKey(key);
    setLibraryStatus(null);
    try {
      await deleteMedia.mutateAsync({ key });
      setLibraryStatus({
        message: `${mediaName(key)} was deleted.`,
        tone: "info",
      });
      await utils.media.list.invalidate();
    } catch (error) {
      setLibraryStatus({
        message: mediaErrorMessage(error),
        tone: "error",
      });
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="media-admin">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Upload images</h2>
          <span className="status-pill">
            {uploading ? "Uploading" : "Ready"}
          </span>
        </div>
        <div className="admin-panel__body media-upload-panel">
          <div
            className={[
              "media-dropzone",
              dragActive ? "media-dropzone--active" : "",
              uploading ? "media-dropzone--disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!uploading) setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (event.currentTarget === event.target) setDragActive(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <p>
              <strong>Drop images here</strong>
              <span>or choose up to 20 files at once</span>
            </p>
            <button
              className="button button--ember button--small"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Choose images
            </button>
            <input
              accept={MEDIA_FILE_ACCEPT}
              className="sr-only"
              disabled={uploading}
              multiple
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
              ref={fileInputRef}
              tabIndex={-1}
              type="file"
            />
            <small>JPEG, PNG, WebP, GIF, or AVIF · 20 MiB maximum each</small>
          </div>

          {batchMessage && (
            <p className="form-status form-status--error" role="alert">
              {batchMessage}
            </p>
          )}

          {uploads.length > 0 && (
            <div className="media-upload-queue">
              <div className="media-upload-queue__head">
                <h3>Current session</h3>
                {!uploading && (
                  <button
                    className="admin-icon-button"
                    onClick={() => setUploads([])}
                    type="button"
                  >
                    Clear list
                  </button>
                )}
              </div>
              <ul aria-live="polite">
                {uploads.map((item) => (
                  <li key={item.id}>
                    <div className="media-upload-item__copy">
                      <strong title={item.file.name}>{item.file.name}</strong>
                      <span>{formatBytes(item.file.size)}</span>
                    </div>
                    <span
                      className={`status-pill status-pill--${
                        item.state === "success"
                          ? "active"
                          : item.state === "error"
                            ? "failed"
                            : "pending"
                      }`}
                    >
                      {item.state}
                    </span>
                    <p
                      className={
                        item.state === "error" ? "form-status--error" : ""
                      }
                    >
                      {item.message}
                    </p>
                    <div className="admin-actions">
                      {item.publicUrl && (
                        <button
                          className="admin-icon-button"
                          onClick={() =>
                            void copyUrl(item.id, item.publicUrl ?? "")
                          }
                          type="button"
                        >
                          {copiedKey === item.id ? "Copied" : "Copy URL"}
                        </button>
                      )}
                      {item.retryable && (
                        <button
                          className="admin-icon-button"
                          disabled={uploading}
                          onClick={() => {
                            void uploadOne(item).then(() =>
                              utils.media.list.invalidate(),
                            );
                          }}
                          type="button"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>R2 image library</h2>
          <button
            className="admin-icon-button"
            disabled={library.isFetching}
            onClick={() => void library.refetch()}
            type="button"
          >
            {library.isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {libraryStatus && (
          <p
            aria-live="polite"
            className={[
              "media-library-status",
              libraryStatus.tone === "error" ? "form-status--error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role={libraryStatus.tone === "error" ? "alert" : "status"}
          >
            {libraryStatus.message}
          </p>
        )}

        {library.isLoading ? (
          <div className="admin-loading">Loading the R2 library…</div>
        ) : library.error ? (
          <div className="admin-empty">
            <div>
              <p>{library.error.message}</p>
              <button
                className="admin-icon-button"
                onClick={() => void library.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : library.data?.items.length ? (
          <>
            <div className="media-library-grid">
              {library.data.items.map((item) => (
                <article className="media-card" key={item.key}>
                  <div className="media-card__preview">
                    <img alt="" loading="lazy" src={item.publicUrl} />
                  </div>
                  <div className="media-card__body">
                    <strong title={mediaName(item.key)}>
                      {mediaName(item.key)}
                    </strong>
                    <span>
                      {formatBytes(item.size)} · {formatDate(item.lastModified)}
                    </span>
                    <code title={item.publicUrl}>{item.publicUrl}</code>
                    <div className="admin-actions">
                      <button
                        className="admin-icon-button"
                        onClick={() => void copyUrl(item.key, item.publicUrl)}
                        type="button"
                      >
                        {copiedKey === item.key ? "Copied" : "Copy URL"}
                      </button>
                      <button
                        className="admin-icon-button admin-icon-button--danger"
                        disabled={deletingKey !== null}
                        onClick={() => void removeMedia(item.key)}
                        type="button"
                      >
                        {deletingKey === item.key ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="media-pagination">
              <button
                className="admin-icon-button"
                disabled={cursorHistory.length === 1 || library.isFetching}
                onClick={() =>
                  setCursorHistory((current) => current.slice(0, -1))
                }
                type="button"
              >
                ← Previous
              </button>
              <span>Page {cursorHistory.length}</span>
              <button
                className="admin-icon-button"
                disabled={!library.data.nextCursor || library.isFetching}
                onClick={() => {
                  const nextCursor = library.data.nextCursor;
                  if (nextCursor) {
                    setCursorHistory((current) => [...current, nextCursor]);
                  }
                }}
                type="button"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="admin-empty">
            No images have been uploaded to the media library yet.
          </div>
        )}
      </section>
    </div>
  );
}
