"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import { parseGalleryImages } from "@/app/_lib/content-shared";
import { ImageUrlField } from "@/app/admin/_components/image-url-field";
import { api } from "@/trpc/react";

type GalleryCategory = "PAINTING" | "PHOTOGRAPHY" | "COMMISSION";

type GalleryFormState = {
  title: string;
  slug: string;
  category: GalleryCategory;
  excerpt: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  images: Array<{ url: string; alt: string }>;
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
  category: "PAINTING",
  excerpt: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  images: [],
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

  function updateAdditionalImage(
    index: number,
    key: "url" | "alt",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [key]: value } : image,
      ),
    }));
  }

  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>
            {editingId
              ? "Galeriebeitrag bearbeiten"
              : "Galeriebeitrag hinzufügen"}
          </h2>
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
              Bearbeitung abbrechen
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
                category: form.category,
                excerpt: form.excerpt.trim() || null,
                description: form.description.trim() || null,
                imageUrl: form.imageUrl.trim(),
                imageAlt: form.imageAlt.trim(),
                images: form.images.map((image) => ({
                  url: image.url.trim(),
                  alt: image.alt.trim(),
                })),
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
              <label htmlFor="gallery-title">Titel</label>
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
              <label htmlFor="gallery-category">Kategorie</label>
              <select
                className="form-select"
                id="gallery-category"
                onChange={(event) =>
                  update("category", event.target.value as GalleryCategory)
                }
                required
                value={form.category}
              >
                <option value="PAINTING">Gemälde</option>
                <option value="PHOTOGRAPHY">Fotografie</option>
                <option value="COMMISSION">Auftragsarbeit</option>
              </select>
            </div>
            <fieldset className="gallery-images-fieldset">
              <legend>Weitere Bilder</legend>
              <p className="gallery-images-fieldset__help">
                Diese Bilder erscheinen auf der Werkseite nach dem Titelbild.
              </p>
              <div className="gallery-images-list">
                {form.images.map((image, index) => (
                  <div className="gallery-image-fields" key={index}>
                    <div className="gallery-image-fields__head">
                      <strong>Bild {index + 2}</strong>
                      <button
                        className="admin-icon-button admin-icon-button--danger"
                        disabled={busy}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            images: current.images.filter(
                              (_, imageIndex) => imageIndex !== index,
                            ),
                          }))
                        }
                        type="button"
                      >
                        Entfernen
                      </button>
                    </div>
                    <ImageUrlField
                      disabled={pending}
                      id={`gallery-image-${index + 2}`}
                      label="Bild-URL"
                      onBusyChange={setImageUploading}
                      onChange={(value) =>
                        updateAdditionalImage(index, "url", value)
                      }
                      placeholder="/artworks/work-name-detail.webp"
                      required
                      value={image.url}
                    />
                    <div className="form-field">
                      <label htmlFor={`gallery-alt-${index + 2}`}>
                        Bildbeschreibung
                      </label>
                      <input
                        className="form-input"
                        id={`gallery-alt-${index + 2}`}
                        onChange={(event) =>
                          updateAdditionalImage(
                            index,
                            "alt",
                            event.target.value,
                          )
                        }
                        placeholder="Beschreibe dieses Bild für Screenreader"
                        required
                        value={image.alt}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="admin-icon-button"
                disabled={busy || form.images.length >= 30}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    images: [...current.images, { url: "", alt: "" }],
                  }))
                }
                type="button"
              >
                + Weiteres Bild hinzufügen
              </button>
            </fieldset>
            <div className="form-field">
              <label htmlFor="gallery-slug">URL-Kürzel</label>
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
              label="Bild-URL"
              onBusyChange={setImageUploading}
              onChange={(value) => update("imageUrl", value)}
              placeholder="/artworks/work-name.webp"
              required
              value={form.imageUrl}
            />
            <div className="form-field">
              <label htmlFor="gallery-alt">Bildbeschreibung</label>
              <input
                className="form-input"
                id="gallery-alt"
                onChange={(event) => update("imageAlt", event.target.value)}
                placeholder="Beschreibe das Werk für Screenreader"
                required
                value={form.imageAlt}
              />
            </div>
            <div className="form-field">
              <label htmlFor="gallery-excerpt">Kurze Einführung</label>
              <textarea
                className="form-textarea"
                id="gallery-excerpt"
                maxLength={320}
                onChange={(event) => update("excerpt", event.target.value)}
                placeholder="Ein kurzer Text für das Portfolio."
                style={{ minHeight: "5rem" }}
                value={form.excerpt}
              />
            </div>
            <div className="form-field">
              <label htmlFor="gallery-description">
                Ausführliche Beschreibung
              </label>
              <textarea
                className="form-textarea"
                id="gallery-description"
                onChange={(event) => update("description", event.target.value)}
                placeholder="Materialien, Kontext und die Geschichte des Werks."
                value={form.description}
              />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="gallery-medium">Technik</label>
                <input
                  className="form-input"
                  id="gallery-medium"
                  onChange={(event) => update("medium", event.target.value)}
                  placeholder="Mischtechnik"
                  value={form.medium}
                />
              </div>
              <div className="form-field">
                <label htmlFor="gallery-dimensions">Maße</label>
                <input
                  className="form-input"
                  id="gallery-dimensions"
                  onChange={(event) => update("dimensions", event.target.value)}
                  placeholder="90 × 120 cm"
                  value={form.dimensions}
                />
              </div>
              <div className="form-field">
                <label htmlFor="gallery-year">Jahr</label>
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
                <label htmlFor="gallery-order">Sortierreihenfolge</label>
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
                <span>Im Portfolio prominent hervorheben.</span>
              </label>
              <label className="checkbox">
                <input
                  checked={form.published}
                  onChange={(event) =>
                    update("published", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Beim Speichern öffentlich veröffentlichen.</span>
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
                ? "Bild wird hochgeladen…"
                : pending
                  ? "Wird gespeichert…"
                  : editingId
                    ? "Galeriebeitrag aktualisieren"
                    : "Galeriebeitrag erstellen"}
            </button>
          </form>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Alle Galeriebeiträge</h2>
          <span className="status-pill">{gallery.data?.length ?? 0} Werke</span>
        </div>
        {gallery.isLoading ? (
          <div className="admin-loading">Archiv wird geladen…</div>
        ) : gallery.error ? (
          <div className="admin-empty">{gallery.error.message}</div>
        ) : gallery.data?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Werk</th>
                  <th>Kategorie</th>
                  <th>Jahr</th>
                  <th>Sichtbarkeit</th>
                  <th>Reihenfolge</th>
                  <th>Aktionen</th>
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
                    <td>
                      {item.category === "COMMISSION"
                        ? "Auftragsarbeit"
                        : item.category === "PHOTOGRAPHY"
                          ? "Fotografie"
                          : "Gemälde"}
                    </td>
                    <td>{item.year ?? "—"}</td>
                    <td>
                      <span
                        className={`status-pill status-pill--${item.published ? "active" : "draft"}`}
                      >
                        {item.published ? "Veröffentlicht" : "Entwurf"}
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
                              category: item.category,
                              excerpt: item.excerpt ?? "",
                              description: item.description ?? "",
                              imageUrl: item.imageUrl,
                              imageAlt: item.imageAlt,
                              images: parseGalleryImages(item.images),
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
                          Bearbeiten
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
                          {item.published ? "Zurückziehen" : "Veröffentlichen"}
                        </button>
                        <button
                          className="admin-icon-button admin-icon-button--danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `„${item.title}“ dauerhaft löschen?`,
                              )
                            ) {
                              deletePost.mutate({ id: item.id });
                            }
                          }}
                          type="button"
                        >
                          Löschen
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
            Das Archiv ist leer. Füge hier den ersten Galeriebeitrag hinzu.
          </div>
        )}
      </section>
    </div>
  );
}
