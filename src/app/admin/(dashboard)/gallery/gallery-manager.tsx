"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import { ImageUrlField } from "@/app/admin/_components/image-url-field";
import { api } from "@/trpc/react";

type GalleryFormState = {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  medium: string;
  dimensions: string;
  year: string;
  sortOrder: string;
  featured: boolean;
  published: boolean;
};

const emptyForm: GalleryFormState = {
  title: "",
  slug: "",
  excerpt: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  medium: "",
  dimensions: "",
  year: String(new Date().getFullYear()),
  sortOrder: "0",
  featured: false,
  published: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function GalleryManager() {
  const utils = api.useUtils();
  const gallery = api.gallery.adminList.useQuery();
  const [form, setForm] = useState<GalleryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const finishMutation = async () => {
    await utils.gallery.adminList.invalidate();
    await utils.gallery.publicList.invalidate();
    setForm(emptyForm);
    setEditingId(null);
  };

  const createPost = api.gallery.create.useMutation({
    onSuccess: finishMutation,
  });
  const updatePost = api.gallery.update.useMutation({
    onSuccess: finishMutation,
  });
  const deletePost = api.gallery.delete.useMutation({
    onSuccess: async () => {
      await utils.gallery.adminList.invalidate();
      await utils.gallery.publicList.invalidate();
    },
  });

  const pending =
    createPost.isPending || updatePost.isPending || deletePost.isPending;
  const busy = pending || imageUploading;
  const mutationError =
    createPost.error ?? updatePost.error ?? deletePost.error;

  function update<K extends keyof GalleryFormState>(
    key: K,
    value: GalleryFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>{editingId ? "Edit gallery post" : "Add gallery post"}</h2>
          {editingId && (
            <button
              className="admin-icon-button"
              disabled={imageUploading}
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              type="button"
            >
              Cancel edit
            </button>
          )}
        </div>
        <div className="admin-panel__body">
          <form
            className="admin-form"
            onSubmit={(event) => {
              event.preventDefault();
              const values = {
                title: form.title.trim(),
                slug: form.slug.trim(),
                excerpt: form.excerpt.trim() || null,
                description: form.description.trim() || null,
                imageUrl: form.imageUrl.trim(),
                imageAlt: form.imageAlt.trim(),
                medium: form.medium.trim() || null,
                dimensions: form.dimensions.trim() || null,
                year: form.year ? Number(form.year) : null,
                featured: form.featured,
                published: form.published,
                sortOrder: Number(form.sortOrder) || 0,
              };

              if (editingId) {
                updatePost.mutate({ id: editingId, ...values });
              } else {
                createPost.mutate(values);
              }
            }}
          >
            <div className="form-field">
              <label htmlFor="gallery-title">Title</label>
              <input
                className="form-input"
                id="gallery-title"
                onChange={(event) => {
                  const title = event.target.value;
                  setForm((current) => ({
                    ...current,
                    title,
                    slug:
                      !editingId &&
                      (!current.slug || current.slug === slugify(current.title))
                        ? slugify(title)
                        : current.slug,
                  }));
                }}
                placeholder="Threshold II"
                required
                value={form.title}
              />
            </div>
            <div className="form-field">
              <label htmlFor="gallery-slug">URL slug</label>
              <input
                className="form-input"
                id="gallery-slug"
                onChange={(event) => update("slug", event.target.value)}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="threshold-ii"
                required
                value={form.slug}
              />
            </div>
            <ImageUrlField
              disabled={pending}
              id="gallery-image"
              key={editingId ?? "new"}
              label="Image URL"
              onBusyChange={setImageUploading}
              onChange={(value) => update("imageUrl", value)}
              placeholder="/artworks/work-name.webp"
              required
              value={form.imageUrl}
            />
            <div className="form-field">
              <label htmlFor="gallery-alt">Image description</label>
              <input
                className="form-input"
                id="gallery-alt"
                onChange={(event) => update("imageAlt", event.target.value)}
                placeholder="Describe the artwork for screen readers"
                required
                value={form.imageAlt}
              />
            </div>
            <div className="form-field">
              <label htmlFor="gallery-excerpt">Short introduction</label>
              <textarea
                className="form-textarea"
                id="gallery-excerpt"
                maxLength={320}
                onChange={(event) => update("excerpt", event.target.value)}
                placeholder="A short line used on the portfolio."
                style={{ minHeight: "5rem" }}
                value={form.excerpt}
              />
            </div>
            <div className="form-field">
              <label htmlFor="gallery-description">Full description</label>
              <textarea
                className="form-textarea"
                id="gallery-description"
                onChange={(event) => update("description", event.target.value)}
                placeholder="Materials, context, and the story of the work."
                value={form.description}
              />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="gallery-medium">Medium</label>
                <input
                  className="form-input"
                  id="gallery-medium"
                  onChange={(event) => update("medium", event.target.value)}
                  placeholder="Mixed media"
                  value={form.medium}
                />
              </div>
              <div className="form-field">
                <label htmlFor="gallery-dimensions">Dimensions</label>
                <input
                  className="form-input"
                  id="gallery-dimensions"
                  onChange={(event) => update("dimensions", event.target.value)}
                  placeholder="90 × 120 cm"
                  value={form.dimensions}
                />
              </div>
              <div className="form-field">
                <label htmlFor="gallery-year">Year</label>
                <input
                  className="form-input"
                  id="gallery-year"
                  max={new Date().getFullYear() + 1}
                  min={1000}
                  onChange={(event) => update("year", event.target.value)}
                  type="number"
                  value={form.year}
                />
              </div>
              <div className="form-field">
                <label htmlFor="gallery-order">Sort order</label>
                <input
                  className="form-input"
                  id="gallery-order"
                  onChange={(event) => update("sortOrder", event.target.value)}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
            </div>
            <div className="form-grid">
              <label className="checkbox">
                <input
                  checked={form.featured}
                  onChange={(event) => update("featured", event.target.checked)}
                  type="checkbox"
                />
                <span>Feature prominently on the portfolio.</span>
              </label>
              <label className="checkbox">
                <input
                  checked={form.published}
                  onChange={(event) =>
                    update("published", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Publish publicly when saved.</span>
              </label>
            </div>

            {mutationError && (
              <p className="form-status form-status--error" role="alert">
                {mutationError.message}
              </p>
            )}

            <button
              className="button button--ember"
              disabled={busy}
              type="submit"
            >
              {imageUploading
                ? "Uploading image…"
                : pending
                  ? "Saving…"
                  : editingId
                    ? "Update gallery post"
                    : "Create gallery post"}
            </button>
          </form>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>All gallery posts</h2>
          <span className="status-pill">{gallery.data?.length ?? 0} works</span>
        </div>
        {gallery.isLoading ? (
          <div className="admin-loading">Loading the archive…</div>
        ) : gallery.error ? (
          <div className="admin-empty">{gallery.error.message}</div>
        ) : gallery.data?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Year</th>
                  <th>Visibility</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {gallery.data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-table__title">
                        <img
                          alt=""
                          className="admin-table__thumb"
                          src={item.imageUrl}
                        />
                        <span>
                          <strong>{item.title}</strong>
                          <br />
                          <span style={{ color: "var(--bone-dim)" }}>
                            /{item.slug}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>{item.year ?? "—"}</td>
                    <td>
                      <span
                        className={`status-pill status-pill--${item.published ? "active" : "draft"}`}
                      >
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>{item.sortOrder}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-icon-button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(item.id);
                            setForm({
                              title: item.title,
                              slug: item.slug,
                              excerpt: item.excerpt ?? "",
                              description: item.description ?? "",
                              imageUrl: item.imageUrl,
                              imageAlt: item.imageAlt,
                              medium: item.medium ?? "",
                              dimensions: item.dimensions ?? "",
                              year: item.year?.toString() ?? "",
                              sortOrder: item.sortOrder.toString(),
                              featured: item.featured,
                              published: item.published,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="admin-icon-button"
                          disabled={busy}
                          onClick={() =>
                            updatePost.mutate({
                              id: item.id,
                              published: !item.published,
                            })
                          }
                          type="button"
                        >
                          {item.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className="admin-icon-button admin-icon-button--danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Permanently delete “${item.title}”?`,
                              )
                            ) {
                              deletePost.mutate({ id: item.id });
                            }
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            The archive is empty. Add the first gallery post here.
          </div>
        )}
      </section>
    </div>
  );
}
