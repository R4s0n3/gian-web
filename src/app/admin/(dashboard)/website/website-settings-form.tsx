"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

import { ImageUrlField } from "@/app/admin/_components/image-url-field";
import { api } from "@/trpc/react";

type WebsiteFormState = {
  heroImageUrl: string;
  heroImageAlt: string;
};

type FormStatus =
  | { tone: "idle"; message: "" }
  | { tone: "success" | "error"; message: string };

const emptyForm: WebsiteFormState = {
  heroImageUrl: "",
  heroImageAlt: "",
};

export function WebsiteSettingsForm() {
  const utils = api.useUtils();
  const settings = api.siteSettings.adminGet.useQuery();
  const initializedRef = useRef(false);
  const [form, setForm] = useState<WebsiteFormState>(emptyForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [status, setStatus] = useState<FormStatus>({
    tone: "idle",
    message: "",
  });

  useEffect(() => {
    if (settings.data === undefined || initializedRef.current) return;

    setForm({
      heroImageUrl: settings.data?.heroImageUrl ?? "",
      heroImageAlt: settings.data?.heroImageAlt ?? "",
    });
    initializedRef.current = true;
  }, [settings.data]);

  const updateSettings = api.siteSettings.update.useMutation({
    onSuccess: async (data) => {
      setForm({
        heroImageUrl: data.heroImageUrl ?? "",
        heroImageAlt: data.heroImageAlt ?? "",
      });
      await Promise.all([
        utils.siteSettings.adminGet.invalidate(),
        utils.siteSettings.publicGet.invalidate(),
      ]);
      setStatus({
        tone: "success",
        message:
          data.heroImageUrl && data.heroImageAlt
            ? "Das Hero-Bild wurde gespeichert."
            : "Das Hero-Bild wurde entfernt. Die Website zeigt nun den neutralen Platzhalter.",
      });
    },
    onError: (error) => {
      setStatus({ tone: "error", message: error.message });
    },
  });

  const busy = settings.isLoading || updateSettings.isPending || imageUploading;
  const hasSavedHero = Boolean(
    settings.data?.heroImageUrl && settings.data.heroImageAlt,
  );
  const hasFormContent = Boolean(
    form.heroImageUrl.trim() || form.heroImageAlt.trim(),
  );

  function saveSettings() {
    const heroImageUrl = form.heroImageUrl.trim();
    const heroImageAlt = form.heroImageAlt.trim();

    if (Boolean(heroImageUrl) !== Boolean(heroImageAlt)) {
      setStatus({
        tone: "error",
        message:
          "Bild-URL und Bildbeschreibung müssen entweder beide ausgefüllt oder beide leer sein.",
      });
      return;
    }

    setStatus({ tone: "idle", message: "" });
    updateSettings.mutate({
      heroImageUrl: heroImageUrl === "" ? null : heroImageUrl,
      heroImageAlt: heroImageAlt === "" ? null : heroImageAlt,
    });
  }

  function clearSettings() {
    setStatus({ tone: "idle", message: "" });
    updateSettings.mutate({
      heroImageUrl: null,
      heroImageAlt: null,
    });
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
          <h2>Hero-Bild</h2>
          <span
            className={`status-pill status-pill--${
              hasSavedHero ? "active" : "draft"
            }`}
          >
            {hasSavedHero ? "Konfiguriert" : "Platzhalter aktiv"}
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
            <p className="gallery-images-fieldset__help">
              Das Landschaftsbild erscheint im gerahmten Bereich der Startseite
              in Schwarzweiß. Empfohlen sind 3:2, WebP oder AVIF und mindestens
              2000 px Breite.
            </p>
            <ImageUrlField
              disabled={updateSettings.isPending}
              id="website-hero-image"
              label="Hero-Bild-URL"
              onBusyChange={setImageUploading}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  heroImageUrl: value,
                }));
                setStatus({ tone: "idle", message: "" });
              }}
              placeholder="https://…/hero.webp"
              required={Boolean(form.heroImageAlt.trim())}
              value={form.heroImageUrl}
            />
            <div className="form-field">
              <label htmlFor="website-hero-alt">Bildbeschreibung</label>
              <input
                aria-describedby="website-hero-alt-help"
                className="form-input"
                id="website-hero-alt"
                maxLength={250}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    heroImageAlt: event.target.value,
                  }));
                  setStatus({ tone: "idle", message: "" });
                }}
                placeholder="Landschaftsfotografie mit …"
                required={Boolean(form.heroImageUrl.trim())}
                value={form.heroImageAlt}
              />
              <p
                className="gallery-images-fieldset__help"
                id="website-hero-alt-help"
              >
                Beschreibe das Motiv präzise für Screenreader. URL und
                Beschreibung werden immer gemeinsam gespeichert.
              </p>
            </div>

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
                  ? "Bild wird hochgeladen…"
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
                      "Hero-Bild von der Startseite entfernen? Die Datei bleibt in der Medienbibliothek erhalten.",
                    )
                  ) {
                    clearSettings();
                  }
                }}
                type="button"
              >
                Hero-Bild entfernen
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Vorschau</h2>
          <span className="status-pill">3:2 / Schwarzweiß</span>
        </div>
        <div className="admin-panel__body">
          <figure className="website-hero-preview">
            <div className="website-hero-preview__media">
              {form.heroImageUrl.trim() ? (
                <img
                  alt={form.heroImageAlt.trim()}
                  className="website-hero-preview__image"
                  src={form.heroImageUrl.trim()}
                />
              ) : (
                <span className="website-hero-preview__placeholder">
                  Noch kein Hero-Bild ausgewählt
                </span>
              )}
              <img
                alt=""
                aria-hidden="true"
                className="website-hero-preview__logo"
                src="/logo.svg"
              />
            </div>
            <figcaption className="gallery-images-fieldset__help">
              Vorschau des gerahmten Hero-Motivs mit weißem Monogramm.
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
