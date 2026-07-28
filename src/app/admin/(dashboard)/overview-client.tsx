"use client";

import Link from "next/link";

import { formatMoney } from "@/app/_lib/content-shared";
import { STUDIO_TIME_ZONE } from "@/app/_lib/studio-time";
import { adminStatusLabel } from "@/app/admin/_lib/labels";
import { api } from "@/trpc/react";

function formatDate(value: Date | string, timeZone?: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}

export function OverviewClient() {
  const gallery = api.gallery.adminList.useQuery();
  const products = api.product.adminList.useQuery();
  const orders = api.order.adminList.useQuery();
  const bookings = api.booking.adminList.useQuery();

  const loading =
    gallery.isLoading ||
    products.isLoading ||
    orders.isLoading ||
    bookings.isLoading;
  const error =
    gallery.error ?? products.error ?? orders.error ?? bookings.error;
  const revenueByCurrency = new Map<string, number>();
  for (const order of orders.data ?? []) {
    if (!["PAID", "PROCESSING", "FULFILLED"].includes(order.status)) continue;
    revenueByCurrency.set(
      order.currency,
      (revenueByCurrency.get(order.currency) ?? 0) + order.totalCents,
    );
  }
  const pendingBookings =
    bookings.data?.filter((booking) => booking.status === "PENDING").length ??
    0;
  const upcomingBookings =
    bookings.data
      ?.filter(
        (booking) =>
          new Date(booking.startAt).getTime() >= Date.now() &&
          (booking.status === "PENDING" || booking.status === "CONFIRMED"),
      )
      .slice(0, 5) ?? [];
  const published = gallery.data?.filter((item) => item.published).length ?? 0;

  return (
    <>
      {error && (
        <p className="form-status form-status--error" role="alert">
          Dashboarddaten konnten nicht geladen werden: {error.message}
        </p>
      )}

      <div className="admin-kpis" aria-busy={loading}>
        <article className="admin-kpi">
          <span className="admin-kpi__label">Veröffentlichte Werke</span>
          <strong className="admin-kpi__value">
            {loading ? "—" : published}
          </strong>
        </article>
        <article className="admin-kpi">
          <span className="admin-kpi__label">Aktive Produkte</span>
          <strong className="admin-kpi__value">
            {loading
              ? "—"
              : (products.data?.filter((item) => item.active).length ?? 0)}
          </strong>
        </article>
        <article className="admin-kpi">
          <span className="admin-kpi__label">
            Umsatz bezahlter Bestellungen
          </span>
          <strong className="admin-kpi__value">
            {loading
              ? "—"
              : revenueByCurrency.size
                ? [...revenueByCurrency].map(([currency, cents]) => (
                    <span key={currency}>
                      {formatMoney(cents, currency)}
                      <br />
                    </span>
                  ))
                : formatMoney(0, "EUR")}
          </strong>
        </article>
        <article className="admin-kpi">
          <span className="admin-kpi__label">Offene Terminanfragen</span>
          <strong className="admin-kpi__value">
            {loading ? "—" : pendingBookings}
          </strong>
        </article>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Anstehende Anfragen</h2>
            <Link className="text-link" href="/admin/bookings">
              Alle Termine
            </Link>
          </div>
          {bookings.isLoading ? (
            <div className="admin-loading">Kalender wird geladen…</div>
          ) : upcomingBookings.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kundschaft</th>
                    <th>Datum</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <strong>{booking.name}</strong>
                        <br />
                        <span style={{ color: "var(--bone-dim)" }}>
                          {booking.service}
                        </span>
                      </td>
                      <td>{formatDate(booking.startAt, STUDIO_TIME_ZONE)}</td>
                      <td>
                        <span
                          className={`status-pill status-pill--${booking.status.toLowerCase()}`}
                        >
                          {adminStatusLabel(booking.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">Noch keine Terminanfragen.</div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Neueste Bestellungen</h2>
            <Link className="text-link" href="/admin/orders">
              Alle Bestellungen
            </Link>
          </div>
          {orders.isLoading ? (
            <div className="admin-loading">Bestellungen werden geladen…</div>
          ) : orders.data?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kundschaft</th>
                    <th>Artikel</th>
                    <th>Gesamt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td>
                        {order.email}
                        <br />
                        <span style={{ color: "var(--bone-dim)" }}>
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td>
                        {order.items.reduce(
                          (total, item) => total + item.quantity,
                          0,
                        )}
                      </td>
                      <td>{formatMoney(order.totalCents, order.currency)}</td>
                      <td>
                        <span
                          className={`status-pill status-pill--${order.status.toLowerCase()}`}
                        >
                          {adminStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">Noch keine Shop-Bestellungen.</div>
          )}
        </section>
      </div>
    </>
  );
}
