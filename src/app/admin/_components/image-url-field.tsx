"use client";

import { useEffect, useRef, useState } from "react";

import {
  MEDIA_FILE_ACCEPT,
  mediaErrorMessage,
  uploadMediaFile,
} from "@/app/admin/_lib/media-upload";
import { api } from "@/trpc/react";

type UploadStatus =
  | { state: "idle" }
  | { state: "uploading"; message: string }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type ImageUrlFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBusyChange?: (busy: boolean) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

export function ImageUrlField({
  id,
  label,
  value,
  onChange,
  onBusyChange,
  placeholder,
  required = false,
  disabled = false,
}: ImageUrlFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef(value);
  const emittedValueRef = useRef<string | null>(null);
  const createUpload = api.media.createUpload.useMutation();
  const [status, setStatus] = useState<UploadStatus>({ state: "idle" });

  const statusId = `${id}-upload-status`;
  const uploading = status.state === "uploading";

  useEffect(() => {
    if (previousValueRef.current === value) return;

    previousValueRef.current = value;
    if (emittedValueRef.current === value) {
      emittedValueRef.current = null;
      return;
    }

    setStatus({ state: "idle" });
  }, [value]);

  async function handleFile(file: File) {
    setStatus({
      state: "uploading",
      message: `Uploading ${file.name}…`,
    });
    onBusyChange?.(true);

    try {
      const result = await uploadMediaFile(file, (input) =>
        createUpload.mutateAsync(input),
      );
      emittedValueRef.current = result.publicUrl;
      onChange(result.publicUrl);
      setStatus({
        state: "success",
        message: `${file.name} uploaded. Save the form to keep this URL.`,
      });
    } catch (error) {
      setStatus({
        state: "error",
        message: mediaErrorMessage(error),
      });
    } finally {
      onBusyChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="image-url-control">
        <input
          aria-describedby={status.state === "idle" ? undefined : statusId}
          className="form-input"
          disabled={disabled || uploading}
          id={id}
          onChange={(event) => {
            emittedValueRef.current = event.target.value;
            onChange(event.target.value);
            setStatus({ state: "idle" });
          }}
          placeholder={placeholder}
          required={required}
          value={value}
        />
        <button
          className="admin-icon-button image-url-control__button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          accept={MEDIA_FILE_ACCEPT}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
      </div>
      {status.state !== "idle" && (
        <p
          aria-live="polite"
          className={`form-status ${
            status.state === "error"
              ? "form-status--error"
              : status.state === "success"
                ? "form-status--success"
                : ""
          }`}
          id={statusId}
          role={status.state === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
