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
  service: "Tattoo consultation",
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
      initialService === "artwork"
        ? "Artwork commission"
        : "Tattoo consultation",
    notes: referencedWork ? `I'm interested in: ${referencedWork}` : "",
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
        <p className="eyebrow">Request received</p>
        <h2 className="display" style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>
          Thank you.
        </h2>
        <p style={{ color: "var(--bone-dim)", margin: 0 }}>
          Your idea is with the studio. You’ll receive a personal reply after
          the request and preferred date have been reviewed.
        </p>
        <button
          className="button"
          onClick={() => setSubmitted(false)}
          type="button"
        >
          Send another request
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
              : "Choose a valid studio date and time",
          );
          return;
        }
        const detailLines = [
          form.placement && `Placement / format: ${form.placement}`,
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
        <h2>Tell the studio what you have in mind</h2>
        <p>
          This is a request, not an automatic confirmation. Gian reviews every
          project personally.
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
            placeholder="Your name"
            required
            type="text"
            value={form.name}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-email">Email</label>
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
          <label htmlFor="booking-phone">Phone / WhatsApp (optional)</label>
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
          <label htmlFor="booking-service">Project type</label>
          <select
            className="form-select"
            id="booking-service"
            onChange={(event) => update("service", event.target.value)}
            value={form.service}
          >
            <option>Tattoo consultation</option>
            <option>Tattoo session</option>
            <option>Artwork commission</option>
            <option>Commercial collaboration</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="booking-date">
            Preferred date ({STUDIO_TIME_ZONE_LABEL})
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
            Preferred time ({STUDIO_TIME_ZONE_LABEL})
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
          <label htmlFor="booking-placement">Placement / format</label>
          <input
            className="form-input"
            id="booking-placement"
            onChange={(event) => update("placement", event.target.value)}
            placeholder="e.g. upper arm, 15 cm"
            type="text"
            value={form.placement}
          />
        </div>
        <div className="form-field">
          <label htmlFor="booking-budget">Budget range (optional)</label>
          <input
            className="form-input"
            id="booking-budget"
            onChange={(event) => update("budget", event.target.value)}
            placeholder="Your comfortable range"
            type="text"
            value={form.budget}
          />
        </div>
        <div className="form-field span-full">
          <label htmlFor="booking-notes">Idea, story, and references</label>
          <textarea
            className="form-textarea"
            id="booking-notes"
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Describe the piece, mood, size, and anything the studio should know."
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
            I agree that the studio may use these details to respond to my
            request. No mailing list, no automated booking.
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
            "The request could not be sent. Please try again."}
        </p>
      )}

      <button
        className="button button--ember"
        disabled={createBooking.isPending}
        type="submit"
      >
        {createBooking.isPending
          ? "Sending request…"
          : "Send booking request →"}
      </button>
    </form>
  );
}
