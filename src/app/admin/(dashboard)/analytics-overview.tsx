"use client";

import { useState } from "react";

import {
  ANALYTICS_PERIODS,
  webVitalRating,
  type AnalyticsBreakdown,
  type AnalyticsPeriod,
  type AnalyticsReport,
  type WebVital,
} from "@/lib/analytics";
import { api } from "@/trpc/react";

const number = new Intl.NumberFormat("de-DE");
const decimal = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const countries = new Intl.DisplayNames(["de"], { type: "region" });
const devices: Record<string, string> = {
  Desktop: "Computer",
  Mobile: "Smartphone",
  Tablet: "Tablet",
};

function formatDay(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const rounded = Math.round(seconds);
  return rounded < 60
    ? `${rounded} Sek.`
    : `${Math.floor(rounded / 60)} Min. ${rounded % 60} Sek.`;
}

function formatVital(vital: WebVital) {
  if (vital.value === null) return "—";
  if (vital.name === "CLS")
    return vital.value.toLocaleString("de-DE", { maximumFractionDigits: 3 });
  if (vital.name === "INP")
    return `${number.format(Math.round(vital.value))} ms`;
  return `${decimal.format(vital.value / 1000)} s`;
}

function Breakdown({
  title,
  metric,
  rows,
  total,
  label = (name) => name,
}: {
  title: string;
  metric: string;
  rows: AnalyticsBreakdown[];
  total: number;
  label?: (name: string) => string;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <h3>{title}</h3>
        <span className="analytics-muted">{metric}</span>
      </div>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table analytics-breakdown">
            <thead>
              <tr>
                <th scope="col">{title}</th>
                <th scope="col">{metric}</th>
                <th scope="col">Anteil</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <span
                      className="analytics-breakdown__name"
                      title={label(row.name)}
                    >
                      {label(row.name)}
                    </span>
                    <span className="analytics-meter" aria-hidden="true">
                      <span
                        style={{
                          width: `${total ? Math.min(100, (row.count / total) * 100) : 0}%`,
                        }}
                      />
                    </span>
                  </td>
                  <td>{number.format(row.count)}</td>
                  <td>
                    {total
                      ? `${decimal.format((row.count / total) * 100)} %`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">Noch keine Daten für diesen Zeitraum.</p>
      )}
    </section>
  );
}

function TrafficChart({ report }: { report: AnalyticsReport }) {
  const peak = Math.max(1, ...report.daily.map((day) => day.pageviews));
  const points = (metric: "visitors" | "pageviews") =>
    report.daily
      .map(
        (day, index) =>
          `${20 + (index / (report.daily.length - 1)) * 680},${150 - (day[metric] / peak) * 125}`,
      )
      .join(" ");

  return (
    <section className="admin-panel analytics-chart-panel">
      <div className="admin-panel__head">
        <h3>Besuche im Zeitverlauf</h3>
        <div className="analytics-legend">
          <span>● Besuchende</span>
          <span>● Seitenaufrufe</span>
        </div>
      </div>
      <div className="admin-panel__body">
        <svg
          className="analytics-chart"
          viewBox="0 0 720 180"
          role="img"
          aria-label={`Besuchende und Seitenaufrufe pro Tag über ${report.days} Tage. Tageswerte stehen unter der Grafik.`}
        >
          <title>Website-Traffic pro Tag (UTC)</title>
          {[25, 87.5, 150].map((y) => (
            <line
              key={y}
              x1="20"
              x2="700"
              y1={y}
              y2={y}
              className="analytics-chart__grid"
            />
          ))}
          <polyline
            points={points("pageviews")}
            className="analytics-chart__views"
          />
          <polyline
            points={points("visitors")}
            className="analytics-chart__visitors"
          />
          {report.daily.map((day, index) => (
            <circle
              key={day.date}
              cx={20 + (index / (report.daily.length - 1)) * 680}
              cy={150 - (day.visitors / peak) * 125}
              r="3"
              className="analytics-chart__point"
            >
              <title>
                {formatDay(day.date)}: {number.format(day.visitors)} Besuchende,{" "}
                {number.format(day.pageviews)} Seitenaufrufe
              </title>
            </circle>
          ))}
          <text x="20" y="173">
            {formatDay(report.daily[0]!.date)}
          </text>
          <text x="700" y="173" textAnchor="end">
            {formatDay(report.daily.at(-1)!.date)}
          </text>
          <text x="700" y="17" textAnchor="end">
            Max. {number.format(peak)}
          </text>
        </svg>
        <details className="analytics-daily">
          <summary>Tageswerte anzeigen</summary>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Tag (UTC)</th>
                  <th scope="col">Besuchende</th>
                  <th scope="col">Seitenaufrufe</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.map((day) => (
                  <tr key={day.date}>
                    <td>{formatDay(day.date)}</td>
                    <td>{number.format(day.visitors)}</td>
                    <td>{number.format(day.pageviews)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}

function Report({ report }: { report: AnalyticsReport }) {
  const metrics = [
    { label: "Besuchende", value: number.format(report.visitors) },
    { label: "Seitenaufrufe", value: number.format(report.pageviews) },
    { label: "Sitzungen", value: number.format(report.sessions) },
    {
      label: "Absprungrate",
      value:
        report.bounceRate === null
          ? "—"
          : `${decimal.format(report.bounceRate)} %`,
    },
  ];
  const descriptions = {
    LCP: "Ladezeit des größten Inhalts",
    INP: "Reaktionszeit auf Interaktionen",
    CLS: "Unerwartete Layoutverschiebung",
    FCP: "Erster sichtbarer Inhalt",
  };

  return (
    <>
      {!report.pageviews && (
        <p className="analytics-notice" role="status">
          Noch keine Besuche erfasst. Sobald die öffentliche Website besucht
          wird, erscheinen hier die ersten Daten.
        </p>
      )}
      <div className="admin-kpis analytics-kpis">
        {metrics.map((metric) => (
          <article className="admin-kpi" key={metric.label}>
            <span className="admin-kpi__label">{metric.label}</span>
            <strong className="admin-kpi__value">{metric.value}</strong>
          </article>
        ))}
      </div>
      <div className="analytics-caption">
        <p>
          Ø Sitzungsdauer{" "}
          <strong>{formatDuration(report.averageSessionDuration)}</strong>
        </p>
        <p>Ein Absprung: eine Seite, kein Klick, weniger als 10 Sekunden.</p>
      </div>
      <TrafficChart report={report} />
      <section className="admin-panel analytics-vitals-panel">
        <div className="admin-panel__head">
          <h3>Web Vitals</h3>
          <span className="analytics-muted">
            75. Perzentil · gesamter Zeitraum
          </span>
        </div>
        <div className="analytics-vitals">
          {report.vitals.map((vital) => {
            const rating = webVitalRating(vital);
            return (
              <article className="analytics-vital" key={vital.name}>
                <span className="admin-kpi__label">{vital.name}</span>
                <strong className="analytics-vital__value">
                  {formatVital(vital)}
                </strong>
                <span
                  className={`analytics-rating analytics-rating--${rating.status}`}
                >
                  {rating.label}
                </span>
                <p>{descriptions[vital.name]}</p>
                <span className="analytics-muted">
                  {number.format(vital.samples)} Messungen
                </span>
              </article>
            );
          })}
        </div>
        <p className="analytics-footnote">
          75 % der Messungen liegen unter diesem Wert. INP wird nach einer
          Interaktion gemessen; fehlende Werte sind keine Nullwerte.
        </p>
      </section>
      <div className="analytics-breakdowns">
        <Breakdown
          title="Beliebte Seiten"
          metric="Seitenaufrufe"
          rows={report.pages}
          total={report.pageviews}
        />
        <Breakdown
          title="Traffic-Quellen"
          metric="Sitzungen"
          rows={report.sources}
          total={report.sessions}
        />
        <Breakdown
          title="Länder"
          metric="Besuchende"
          rows={report.countries}
          total={report.visitors}
          label={(name) =>
            /^[A-Z]{2}$/.test(name) ? (countries.of(name) ?? name) : name
          }
        />
        <Breakdown
          title="Geräte"
          metric="Besuchende"
          rows={report.devices}
          total={report.visitors}
          label={(name) => devices[name] ?? name}
        />
        <Breakdown
          title="Kampagnen"
          metric="Sitzungen"
          rows={report.campaigns}
          total={report.sessions}
        />
      </div>
      <p className="analytics-footnote">
        Quellen und Kampagnen beziehen sich auf den Sitzungseinstieg. Nur die
        öffentliche Website wird erfasst. Tage werden in UTC angezeigt; der
        heutige Tag ist noch unvollständig.
      </p>
    </>
  );
}

export function AnalyticsOverview() {
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const analytics = api.analytics.overview.useQuery(
    { days },
    {
      staleTime: 5 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );
  const report = analytics.data?.configured ? analytics.data.report : undefined;

  return (
    <section
      className="analytics-overview"
      aria-labelledby="analytics-heading"
      aria-busy={analytics.isFetching}
    >
      <header className="analytics-header">
        <div>
          <p className="eyebrow">Publikum / Reichweite</p>
          <h2 id="analytics-heading">Website-Statistik</h2>
          <p className="analytics-muted">
            Traffic und Ladequalität direkt aus PostHog.
          </p>
        </div>
        <div className="analytics-controls">
          <div
            className="admin-actions"
            role="group"
            aria-label="Statistikzeitraum"
          >
            {ANALYTICS_PERIODS.map((period) => (
              <button
                type="button"
                key={period}
                className="admin-icon-button"
                aria-pressed={days === period}
                onClick={() => setDays(period)}
              >
                {period} Tage
              </button>
            ))}
          </div>
          {report && (
            <span className="analytics-muted">
              Stand{" "}
              {new Intl.DateTimeFormat("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(report.updatedAt))}{" "}
              · alle 5 Min.
            </span>
          )}
        </div>
      </header>
      {analytics.isLoading ? (
        <div className="admin-panel admin-loading" role="status">
          Website-Statistik wird geladen…
        </div>
      ) : analytics.error ? (
        <div className="admin-panel admin-panel__body" role="alert">
          <p className="form-status form-status--error">
            {analytics.error.message}
          </p>
          <button
            type="button"
            className="admin-icon-button"
            disabled={analytics.isFetching}
            onClick={() => void analytics.refetch()}
          >
            Erneut versuchen
          </button>
        </div>
      ) : analytics.data?.configured === false ? (
        <div className="admin-panel admin-empty">
          <div>
            <strong>PostHog ist noch nicht verbunden.</strong>
            <p>
              Nach dem Verbinden erscheinen hier Besuche, Quellen, Absprungrate
              und Ladezeiten.
            </p>
          </div>
        </div>
      ) : report ? (
        <Report report={report} />
      ) : null}
    </section>
  );
}
