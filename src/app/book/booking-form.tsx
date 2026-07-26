"use client";

import { useState } from "react";

import {
  STUDIO_TIME_ZONE_LABEL,
  studioLocalTimeToIso,
} from "@/app/_lib/studio-time";
import { api } from "@/trpc/react";

type BookingFormState = {
  name: string;
  email: string;
  phone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  placement: string;
  budget: string;
  notes: string;
  consent: boolean;
};

const initialState: BookingFormState = {
  name: "",
  email: "",
  phone: "",
  service: "Tattoo-Beratung",
  preferredDate: "",
  preferredTime: "11:00",
  placement: "",
  budget: "",
  notes: "",
  consent: false,
};

export function BookingForm({
  initialService,
  referencedWork,
}: {
  initialService?: string;
  referencedWork?: string;
}) {
  const [form, setForm] = useState<BookingFormState>(() => ({
    ...initialState,
    service:
      initialService === "artwork" ? "Kunst-Auftragsarbeit" : "Tattoo-Beratung",
    notes: referencedWork ? `Ich interessiere mich für: ${referencedWork}` : "",
  }));
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createBooking = api.booking.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setForm(initialState);
    },
  });

  function update<K extends keyof BookingFormState>(
    key: K,
    value: BookingFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (submitted) {
    return (
      <div className="booking-form" role="status">
        <p className="eyebrow">Anfrage erhalten</p>
        <h2 className="display" style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>
          Vielen Dank.
        </h2>
        <p style={{ color: "var(--bone-dim)", margin: 0 }}>
          Deine Idee ist im Studio angekommen. Sobald Anfrage und Wunschtermin
          geprüft wurden, erhältst du eine persönliche Antwort.
        </p>
        <button
          className="button"
          onClick={() => setSubmitted(false)}
          type="button"
        >
          Weitere Anfrage senden
        </button>
      </div>
    );
  }

  return (
    <form
      className="booking-form"
      onSubmit={(event) => {
        event.preventDefault();
        setValidationError(null);

        if (!form.consent) {
          return;
        }

        let startAt: string;
        try {
          startAt = studioLocalTimeToIso(
            form.preferredDate,
            form.preferredTime,
          );
        } catch (error) {
          setValidationError(
            error instanceof Error
              ? error.message
              : "Wähle ein gültiges Datum und eine gültige Uhrzeit",
          );
          return;
        }
        const detailLines = [
          form.placement && `Platzierung / Format: ${form.placement}`,
          form.budget && `Budget: ${form.budget}`,
          form.notes,
        ].filter(Boolean);

        createBooking.mutate({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          service: form.service,
          startAt,
          durationMinutes: 60,
          notes: detailLines.join("\n") || undefined,
        });
      }}
    >
      <div className="booking-form__head">
        <h2>Erzähl dem Studio von deiner Idee</h2>
        <p>
          Dies ist eine Anfrage, keine automatische Bestätigung. Gian prüft
          jedes Projekt persönlich.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="booking-name">Name</label>
          <input
            autoComplete="name"
            className="form-input"
            id="booking-name"
            onChange={(event) => update("name", event.target.value)}
            placeholder="Dein Name"
            required
            type="text"
            value={form.name}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-email">E-Mail</label>
          <input
            autoComplete="email"
            className="form-input"
            id="booking-email"
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={form.email}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-phone">Telefon / WhatsApp (optional)</label>
          <input
            autoComplete="tel"
            className="form-input"
            id="booking-phone"
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+00 000 000 000"
            type="tel"
            value={form.phone}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-service">Art des Projekts</label>
          <select
            className="form-select"
            id="booking-service"
            onChange={(event) => update("service", event.target.value)}
            value={form.service}
          >
            <option>Tattoo-Beratung</option>
            <option>Tattoo-Termin</option>
            <option>Kunst-Auftragsarbeit</option>
            <option>Kommerzielle Zusammenarbeit</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="booking-date">
            Wunschtermin ({STUDIO_TIME_ZONE_LABEL})
          </label>
          <input
            className="form-input"
            id="booking-date"
            onChange={(event) => update("preferredDate", event.target.value)}
            required
            type="date"
            value={form.preferredDate}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-time">
            Wunschzeit ({STUDIO_TIME_ZONE_LABEL})
          </label>
          <input
            className="form-input"
            id="booking-time"
            onChange={(event) => update("preferredTime", event.target.value)}
            required
            type="time"
            value={form.preferredTime}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-placement">Platzierung / Format</label>
          <input
            className="form-input"
            id="booking-placement"
            onChange={(event) => update("placement", event.target.value)}
            placeholder="z. B. Oberarm, 15 cm"
            type="text"
            value={form.placement}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-budget">Budgetrahmen (optional)</label>
          <input
            className="form-input"
            id="booking-budget"
            onChange={(event) => update("budget", event.target.value)}
            placeholder="Dein gewünschter Rahmen"
            type="text"
            value={form.budget}
          />
        </div>
        <div className="form-field span-full">
          <label htmlFor="booking-notes">Idee, Geschichte und Referenzen</label>
          <textarea
            className="form-textarea"
            id="booking-notes"
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Beschreibe Motiv, Stimmung, Größe und alles, was das Studio wissen sollte."
            value={form.notes}
          />
        </div>
        <label className="checkbox span-full">
          <input
            checked={form.consent}
            onChange={(event) => update("consent", event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            Ich stimme zu, dass das Studio diese Angaben zur Bearbeitung meiner
            Anfrage verwenden darf. Kein Newsletter, keine automatische Buchung.
          </span>
        </label>
      </div>

      {(validationError ?? createBooking.error?.message) && (
        <p
          aria-live="polite"
          className="form-status form-status--error"
          role="alert"
        >
          {validationError ??
            createBooking.error?.message ??
            "Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut."}
        </p>
      )}

      <button
        className="button button--ember"
        disabled={createBooking.isPending}
        type="submit"
      >
        {createBooking.isPending
          ? "Anfrage wird gesendet…"
          : "Anfrage senden →"}
      </button>
    </form>
  );
}
