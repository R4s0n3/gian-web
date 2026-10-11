"use client";

import { useRef, useState } from "react";
import { hasPdfHeader, MAX_PORTFOLIO_PDF_SIZE } from "@/lib/portfolio";
import { api } from "@/trpc/react";

export function PortfolioPdfForm() {
  const utils = api.useUtils();
  const settings = api.siteSettings.adminGet.useQuery();
  const createUpload = api.siteSettings.createPortfolioUpload.useMutation();
  const savePortfolio = api.siteSettings.savePortfolio.useMutation();
  const removePortfolio = api.siteSettings.removePortfolio.useMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const busy = uploading || removePortfolio.isPending || settings.isLoading;
  const portfolio = settings.data?.portfolioPdf;

  async function upload() {
    if (!file || busy) return;
    setUploading(true);
    setStatus(null);
    try {
      if (
        !/\.pdf$/i.test(file.name) ||
        (file.type && file.type !== "application/pdf")
      )
        throw new Error("Bitte wähle eine PDF-Datei aus.");
      if (!file.size || file.size > MAX_PORTFOLIO_PDF_SIZE)
        throw new Error("Die PDF muss zwischen 1 Byte und 30 MiB groß sein.");
      const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (!hasPdfHeader(header))
        throw new Error("Die ausgewählte Datei ist keine gültige PDF.");
      const ticket = await createUpload.mutateAsync({
        fileName: file.name,
        size: file.size,
      });
      const response = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: ticket.headers,
        body: file,
      });
      if (!response.ok)
        throw new Error(
          "Die PDF konnte nicht hochgeladen werden. Bitte versuche es erneut.",
        );
      await savePortfolio.mutateAsync({ key: ticket.key, fileName: file.name });
      await utils.siteSettings.invalidate();
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setStatus({
        tone: "success",
        message:
          "Das Portfolio steht jetzt auf der Startseite zum Herunterladen bereit.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Die PDF konnte nicht gespeichert werden.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (busy) return;
    setStatus(null);
    try {
      await removePortfolio.mutateAsync();
      await utils.siteSettings.invalidate();
      setStatus({
        tone: "success",
        message: "Der Portfolio-Download wurde entfernt.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Der Download konnte nicht entfernt werden.",
      });
    }
  }

  return (
    <section
      className="admin-panel portfolio-settings"
      aria-labelledby="portfolio-pdf-title"
    >
      <div className="admin-panel__head">
        <h2 id="portfolio-pdf-title">Portfolio-PDF</h2>
        <span className="status-pill">
          {portfolio ? "Download aktiv" : "Keine PDF"}
        </span>
      </div>
      <form
        className="admin-panel__body portfolio-settings__body"
        onSubmit={(event) => {
          event.preventDefault();
          void upload();
        }}
      >
        <p className="form-note">
          Lade dein Portfolio als PDF hoch. Nach dem Hochladen ersetzt es den
          bisherigen Download auf der Startseite.
        </p>
        {portfolio && (
          <div className="portfolio-settings__current">
            <p className="form-note">
              Aktuelle Datei: <strong>{portfolio.fileName}</strong>
            </p>
            <a className="text-link" href="/portfolio/download" download>
              Aktuelle PDF herunterladen ↓
            </a>
          </div>
        )}
        <div className="form-field">
          <label htmlFor="portfolio-pdf-file">Neue Portfolio-PDF</label>
          <input
            accept="application/pdf,.pdf"
            aria-describedby="portfolio-pdf-help"
            className="form-input"
            disabled={busy}
            id="portfolio-pdf-file"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setStatus(null);
            }}
            ref={inputRef}
            type="file"
          />
          <p className="form-note" id="portfolio-pdf-help">
            PDF, höchstens 30 MiB.
          </p>
        </div>
        {settings.isError && (
          <p className="form-status form-status--error" role="alert">
            Die Portfolio-Einstellungen konnten nicht geladen werden.
          </p>
        )}
        {status && (
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
            disabled={busy || !file || settings.isError}
            type="submit"
          >
            {uploading
              ? "PDF wird hochgeladen…"
              : "PDF hochladen und veröffentlichen"}
          </button>
          {portfolio && (
            <button
              className="admin-icon-button admin-icon-button--danger"
              disabled={busy}
              onClick={() => void remove()}
              type="button"
            >
              {removePortfolio.isPending
                ? "Wird entfernt…"
                : "Download entfernen"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
