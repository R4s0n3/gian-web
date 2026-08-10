"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import { ImageUrlField } from "@/app/admin/_components/image-url-field";
import { MAX_HERO_IMAGES } from "@/app/_lib/content-shared";
import { api } from "@/trpc/react";

type HeroImageForm = {
  id: string;
  url: string;
  alt: string;
};

type WebsiteFormState = {
  heroImages: HeroImageForm[];
};

type FormStatus =
  | { tone: "idle"; message: "" }
  | { tone: "success" | "error"; message: string };

const emptyForm: WebsiteFormState = {
  heroImages: [],
};

export function WebsiteSettingsForm() {
  const utils = api.useUtils();
  const settings = api.siteSettings.adminGet.useQuery();
  const initializedRef = useRef(false);
  const nextImageIdRef = useRef(0);
  const uploadingImageIdsRef = useRef(new Set<string>());
  const [form, setForm] = useState<WebsiteFormState>(emptyForm);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [savedImageCount, setSavedImageCount] = useState(0);
  const [status, setStatus] = useState<FormStatus>({
    tone: "idle",
    message: "",
  });

  useEffect(() => {
    if (settings.data === undefined || initializedRef.current) return;

    const heroImages = settings.data.heroImages.map((image) => ({
      id: `saved-${nextImageIdRef.current++}`,
      url: image.url,
      alt: image.alt,
    }));

    setForm({ heroImages });
    setSelectedImageId(heroImages[0]?.id ?? null);
    setSavedImageCount(heroImages.length);
    initializedRef.current = true;
  }, [settings.data]);

  const updateSettings = api.siteSettings.update.useMutation({
    onSuccess: async (data) => {
      setSavedImageCount(data.heroImages.length);
      await Promise.all([
        utils.siteSettings.adminGet.invalidate(),
        utils.siteSettings.publicGet.invalidate(),
      ]);
      setStatus({
        tone: "success",
        message:
          data.heroImages.length > 0
            ? `${data.heroImages.length} ${
                data.heroImages.length === 1
                  ? "Hero-Bild wurde"
                  : "Hero-Bilder wurden"
              } gespeichert.`
            : "Alle Hero-Bilder wurden entfernt. Die Website zeigt nun den neutralen Platzhalter.",
      });
    },
    onError: (error) => {
      setStatus({ tone: "error", message: error.message });
    },
  });

  const imageUploading = uploadingCount > 0;
  const busy = settings.isLoading || updateSettings.isPending || imageUploading;
  const hasSavedHero = savedImageCount > 0;
  const hasFormContent = form.heroImages.length > 0;
  const selectedIndex = form.heroImages.findIndex(
    (image) => image.id === selectedImageId,
  );
  const previewIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const previewImage = form.heroImages[previewIndex];

  function resetStatus() {
    setStatus({ tone: "idle", message: "" });
  }

  function updateImage(imageId: string, field: "url" | "alt", value: string) {
    setForm((current) => ({
      heroImages: current.heroImages.map((image) =>
        image.id === imageId ? { ...image, [field]: value } : image,
      ),
    }));
    setSelectedImageId(imageId);
    resetStatus();
  }

  function handleImageBusy(imageId: string, isBusy: boolean) {
    const uploadingImageIds = uploadingImageIdsRef.current;
    const previousCount = uploadingImageIds.size;

    if (isBusy) {
      uploadingImageIds.add(imageId);
      resetStatus();
    } else {
      uploadingImageIds.delete(imageId);
    }

    if (uploadingImageIds.size !== previousCount) {
      setUploadingCount(uploadingImageIds.size);
    }
  }

  function addImage() {
    if (form.heroImages.length >= MAX_HERO_IMAGES) return;

    const image: HeroImageForm = {
      id: `new-${nextImageIdRef.current++}`,
      url: "",
      alt: "",
    };

    setForm((current) => ({
      heroImages: [...current.heroImages, image],
    }));
    setSelectedImageId(image.id);
    resetStatus();
  }

  function removeImage(imageId: string) {
    const imageIndex = form.heroImages.findIndex(
      (image) => image.id === imageId,
    );
    if (imageIndex < 0) return;

    const heroImages = form.heroImages.filter((image) => image.id !== imageId);
    setForm({ heroImages });

    if (selectedImageId === imageId) {
      setSelectedImageId(
        heroImages[Math.min(imageIndex, heroImages.length - 1)]?.id ?? null,
      );
    }
    resetStatus();
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    setForm((current) => {
      const imageIndex = current.heroImages.findIndex(
        (image) => image.id === imageId,
      );
      const destinationIndex = imageIndex + direction;

      if (
        imageIndex < 0 ||
        destinationIndex < 0 ||
        destinationIndex >= current.heroImages.length
      ) {
        return current;
      }

      const heroImages = [...current.heroImages];
      [heroImages[imageIndex], heroImages[destinationIndex]] = [
        heroImages[destinationIndex]!,
        heroImages[imageIndex]!,
      ];
      return { heroImages };
    });
    setSelectedImageId(imageId);
    resetStatus();
  }

  function saveSettings() {
    const heroImages = form.heroImages.map((image) => ({
      ...image,
      url: image.url.trim(),
      alt: image.alt.trim(),
    }));
    const incompleteIndex = heroImages.findIndex(
      (image) => image.url === "" || image.alt === "",
    );

    if (incompleteIndex >= 0) {
      setSelectedImageId(heroImages[incompleteIndex]!.id);
      setStatus({
        tone: "error",
        message: `Bild ${incompleteIndex + 1} benötigt eine Bild-URL und eine Bildbeschreibung.`,
      });
      return;
    }

    setForm({ heroImages });
    resetStatus();
    updateSettings.mutate({
      heroImages: heroImages.map(({ url, alt }) => ({ url, alt })),
    });
  }

  function clearSettings() {
    resetStatus();
    updateSettings.mutate(
      { heroImages: [] },
      {
        onSuccess: () => {
          setForm(emptyForm);
          setSelectedImageId(null);
        },
      },
    );
  }

  if (settings.isLoading) {
    return <div className="admin-loading">Einstellungen werden geladen…</div>;
  }

  if (settings.error) {
    return (
      <div className="admin-empty" role="alert">
        {settings.error.message}
      </div>
    );
  }

  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Hero-Karussell</h2>
          <span
            className={`status-pill status-pill--${
              hasSavedHero ? "active" : "draft"
            }`}
          >
            {hasSavedHero
              ? `${savedImageCount} ${
                  savedImageCount === 1 ? "Bild" : "Bilder"
                } aktiv`
              : "Platzhalter aktiv"}
          </span>
        </div>
        <div className="admin-panel__body">
          <form
            className="admin-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveSettings();
            }}
          >
            <fieldset className="website-hero-editor">
              <legend className="sr-only">Hero-Bilder verwalten</legend>
              <p className="website-hero-editor__help">
                Bis zu {MAX_HERO_IMAGES} Bilder erscheinen in dieser Reihenfolge
                im Karussell der Startseite. Empfohlen sind breite Querformate,
                WebP oder AVIF und mindestens 2000 px Breite.
              </p>

              <div className="website-hero-list">
                {form.heroImages.map((image, index) => {
                  const selected = image.id === previewImage?.id;

                  return (
                    <div
                      className={
                        selected
                          ? "website-hero-item website-hero-item--selected"
                          : "website-hero-item"
                      }
                      key={image.id}
                      onFocusCapture={() => setSelectedImageId(image.id)}
                    >
                      <div className="website-hero-item__head">
                        <strong className="website-hero-item__title">
                          Bild {index + 1}
                        </strong>
                        <div className="website-hero-item__controls">
                          <button
                            aria-pressed={selected}
                            className="admin-icon-button"
                            disabled={updateSettings.isPending}
                            onClick={() => setSelectedImageId(image.id)}
                            type="button"
                          >
                            Vorschau
                          </button>
                          <button
                            aria-label={`Bild ${index + 1} nach oben verschieben`}
                            className="admin-icon-button"
                            disabled={busy || index === 0}
                            onClick={() => moveImage(image.id, -1)}
                            title="Nach oben"
                            type="button"
                          >
                            ↑
                          </button>
                          <button
                            aria-label={`Bild ${index + 1} nach unten verschieben`}
                            className="admin-icon-button"
                            disabled={
                              busy || index === form.heroImages.length - 1
                            }
                            onClick={() => moveImage(image.id, 1)}
                            title="Nach unten"
                            type="button"
                          >
                            ↓
                          </button>
                          <button
                            aria-label={`Bild ${index + 1} entfernen`}
                            className="admin-icon-button admin-icon-button--danger"
                            disabled={busy}
                            onClick={() => removeImage(image.id)}
                            type="button"
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>

                      <div className="website-hero-item__fields">
                        <ImageUrlField
                          disabled={updateSettings.isPending}
                          id={`website-hero-image-${image.id}`}
                          label="Bild-URL"
                          onBusyChange={(isBusy) =>
                            handleImageBusy(image.id, isBusy)
                          }
                          onChange={(value) =>
                            updateImage(image.id, "url", value)
                          }
                          placeholder="https://…/hero.webp"
                          required
                          value={image.url}
                        />
                        <div className="form-field">
                          <label htmlFor={`website-hero-alt-${image.id}`}>
                            Bildbeschreibung
                          </label>
                          <input
                            aria-describedby={`website-hero-alt-${image.id}-help`}
                            className="form-input"
                            disabled={updateSettings.isPending}
                            id={`website-hero-alt-${image.id}`}
                            maxLength={250}
                            onChange={(event) =>
                              updateImage(image.id, "alt", event.target.value)
                            }
                            placeholder="Beschreibe das Motiv für Screenreader"
                            required
                            value={image.alt}
                          />
                          <p
                            className="gallery-images-fieldset__help"
                            id={`website-hero-alt-${image.id}-help`}
                          >
                            Beschreibe das Motiv präzise. URL und Beschreibung
                            werden immer gemeinsam gespeichert.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="admin-icon-button website-hero-add"
                disabled={busy || form.heroImages.length >= MAX_HERO_IMAGES}
                onClick={addImage}
                type="button"
              >
                + Hero-Bild hinzufügen ({form.heroImages.length}/
                {MAX_HERO_IMAGES})
              </button>
            </fieldset>

            {status.tone !== "idle" && (
              <p
                aria-live="polite"
                className={`form-status form-status--${status.tone}`}
                role={status.tone === "error" ? "alert" : "status"}
              >
                {status.message}
              </p>
            )}

            <div className="admin-actions">
              <button
                className="button button--ember"
                disabled={busy}
                type="submit"
              >
                {imageUploading
                  ? `${uploadingCount} ${
                      uploadingCount === 1 ? "Bild wird" : "Bilder werden"
                    } hochgeladen…`
                  : updateSettings.isPending
                    ? "Wird gespeichert…"
                    : "Einstellungen speichern"}
              </button>
              <button
                className="admin-icon-button admin-icon-button--danger"
                disabled={busy || (!hasSavedHero && !hasFormContent)}
                onClick={() => {
                  if (
                    window.confirm(
                      "Alle Hero-Bilder von der Startseite entfernen? Die Dateien bleiben in der Medienbibliothek erhalten.",
                    )
                  ) {
                    clearSettings();
                  }
                }}
                type="button"
              >
                Alle Hero-Bilder entfernen
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Vorschau</h2>
          <span className="status-pill">
            {previewImage
              ? `Bild ${previewIndex + 1} von ${form.heroImages.length}`
              : "Keine Bilder"}
          </span>
        </div>
        <div className="admin-panel__body">
          <figure className="website-hero-preview">
            <div className="website-hero-preview__media">
              {previewImage?.url.trim() ? (
                <img
                  alt={previewImage.alt.trim()}
                  className="website-hero-preview__image"
                  src={previewImage.url.trim()}
                />
              ) : (
                <span className="website-hero-preview__placeholder">
                  {previewImage
                    ? "Für dieses Bild fehlt noch eine URL"
                    : "Noch kein Hero-Bild ausgewählt"}
                </span>
              )}
              <img
                alt=""
                aria-hidden="true"
                className="website-hero-preview__logo"
                src="/logo.svg"
              />
            </div>

            {previewImage && (
              <div className="website-hero-preview__meta">
                <span>Position {previewIndex + 1}</span>
                <span>
                  {previewImage.alt.trim() || "Bildbeschreibung fehlt"}
                </span>
              </div>
            )}

            {form.heroImages.length > 0 && (
              <div
                aria-label="Hero-Bild für die Vorschau auswählen"
                className="website-hero-thumbnails"
                role="group"
              >
                {form.heroImages.map((image, index) => {
                  const selected = image.id === previewImage?.id;

                  return (
                    <button
                      aria-label={`Bild ${index + 1} in der Vorschau anzeigen`}
                      aria-pressed={selected}
                      className={
                        selected
                          ? "website-hero-thumbnail website-hero-thumbnail--active"
                          : "website-hero-thumbnail"
                      }
                      key={image.id}
                      onClick={() => setSelectedImageId(image.id)}
                      type="button"
                    >
                      {image.url.trim() ? (
                        <img
                          alt=""
                          aria-hidden="true"
                          className="website-hero-thumbnail__image"
                          src={image.url.trim()}
                        />
                      ) : (
                        <span className="website-hero-thumbnail__placeholder">
                          Leer
                        </span>
                      )}
                      <span className="website-hero-thumbnail__number">
                        {index + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <figcaption className="gallery-images-fieldset__help">
              Wähle ein Bild aus, um dessen Zuschnitt und Beschreibung zu
              prüfen. Die Nummerierung entspricht der Reihenfolge im Karussell.
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
