"use client";

import {
  STUDIO_TIME_ZONE,
  STUDIO_TIME_ZONE_LABEL,
} from "@/app/_lib/studio-time";
import { adminStatusLabel } from "@/app/admin/_lib/labels";
import { api } from "@/trpc/react";

const bookingStatuses = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

type BookingStatus = (typeof bookingStatuses)[number];

const allowedTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["PENDING", "CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CONFIRMED", "COMPLETED", "CANCELLED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: STUDIO_TIME_ZONE,
  }).format(new Date(value));
}

export function BookingManager() {
  const utils = api.useUtils();
  const bookings = api.booking.adminList.useQuery();
  const updateStatus = api.booking.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.booking.adminList.invalidate();
    },
  });

  if (bookings.isLoading) {
    return (
      <section className="admin-panel">
        <div className="admin-loading">Studiokalender wird geöffnet…</div>
      </section>
    );
  }

  if (bookings.error) {
    return (
      <section className="admin-panel">
        <div className="admin-empty">{bookings.error.message}</div>
      </section>
    );
  }

  if (!bookings.data?.length) {
    return (
      <section className="admin-panel">
        <div className="admin-empty">
          Noch keine Terminanfragen. Öffentliche Anfragen erscheinen hier.
        </div>
      </section>
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <h2>Terminanfragen</h2>
        <span className="status-pill">{bookings.data.length} Anfragen</span>
      </div>

      {updateStatus.error && (
        <p
          className="form-status form-status--error"
          role="alert"
          style={{ padding: "1rem" }}
        >
          {updateStatus.error.message}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kundschaft</th>
              <th>Projekt</th>
              <th>Gewünschter Termin</th>
              <th>Notizen</th>
              <th>Status</th>
              <th>Eingegangen</th>
            </tr>
          </thead>
          <tbody>
            {bookings.data.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.name}</strong>
                  <br />
                  <a href={`mailto:${booking.email}`}>{booking.email}</a>
                  {booking.phone && (
                    <>
                      <br />
                      <a href={`tel:${booking.phone}`}>{booking.phone}</a>
                    </>
                  )}
                </td>
                <td>{booking.service}</td>
                <td>
                  {formatDate(booking.startAt)}
                  <br />
                  <span style={{ color: "var(--bone-dim)" }}>
                    {booking.durationMinutes} Minuten · {STUDIO_TIME_ZONE_LABEL}
                  </span>
                </td>
                <td>
                  {booking.notes ? (
                    <details>
                      <summary style={{ cursor: "pointer" }}>
                        Anfrage lesen
                      </summary>
                      <p
                        style={{
                          maxWidth: "24rem",
                          margin: "0.8rem 0 0",
                          color: "var(--bone-dim)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {booking.notes}
                      </p>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <label className="sr-only" htmlFor={`booking-${booking.id}`}>
                    Status für {booking.name}
                  </label>
                  <select
                    className="form-select"
                    disabled={updateStatus.isPending}
                    id={`booking-${booking.id}`}
                    onChange={(event) => {
                      const status = bookingStatuses.find(
                        (item) => item === event.target.value,
                      );
                      if (status) {
                        updateStatus.mutate({ id: booking.id, status });
                      }
                    }}
                    style={{ minHeight: "2.4rem", minWidth: "9rem" }}
                    value={booking.status}
                  >
                    {allowedTransitions[booking.status].map((status) => (
                      <option key={status} value={status}>
                        {adminStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {new Intl.DateTimeFormat("de-DE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(booking.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
