import { z } from "zod";

import {
  analyticsDates,
  type AnalyticsPeriod,
  type AnalyticsReport,
  type WebVital,
} from "@/lib/analytics";

type PostHogConfig = {
  apiHost: string;
  projectId: string;
  personalApiKey: string;
  siteOrigin: string;
};

function sqlString(value: string) {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

export function buildAnalyticsQueries(
  days: AnalyticsPeriod,
  siteOrigin: string,
  now: Date,
) {
  const dates = analyticsDates(days, now);
  const start = sqlString(`${dates[0]} 00:00:00`);
  const end = sqlString(now.toISOString().slice(0, 19).replace("T", " "));
  const eventFilter = `timestamp >= toDateTime(${start})
    AND timestamp < toDateTime(${end})
    AND properties.site_origin = ${sqlString(siteOrigin)}`;
  const pageviews = `FROM events WHERE ${eventFilter} AND event = '$pageview'`;
  // PostHog's session table supplies its native engagement-based bounce flag.
  const sessions = `FROM sessions
    WHERE $start_timestamp >= toDateTime(${start})
    AND $start_timestamp < toDateTime(${end})
    AND startsWith($entry_current_url, ${sqlString(`${siteOrigin}/`)})
    AND $entry_pathname != '/admin' AND $entry_pathname NOT LIKE '/admin/%'
    AND $pageview_count > 0`;

  return {
    summary: `SELECT count(DISTINCT distinct_id), count() ${pageviews}`,
    sessions: `SELECT count(), avg($is_bounce) * 100, avg($session_duration) ${sessions}`,
    daily: `SELECT toString(toDate(timestamp)), count(DISTINCT distinct_id), count()
      ${pageviews} GROUP BY toDate(timestamp) ORDER BY toDate(timestamp)`,
    pages: `SELECT coalesce(nullIf(toString(properties.$pathname), ''), '/'), count()
      ${pageviews} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    sources: `SELECT coalesce(nullIf($entry_utm_source, ''),
      nullIf(nullIf($entry_referring_domain, ''), '$direct'), 'Direkt'), count()
      ${sessions} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    campaigns: `SELECT $entry_utm_campaign, count()
      ${sessions} AND $entry_utm_campaign IS NOT NULL AND $entry_utm_campaign != ''
      GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    countries: `SELECT coalesce(nullIf(toString(properties.$geoip_country_code), ''), 'Unbekannt'),
      count(DISTINCT distinct_id) ${pageviews} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    devices: `SELECT coalesce(nullIf(toString(properties.$device_type), ''), 'Unbekannt'),
      count(DISTINCT distinct_id) ${pageviews} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    vitals: (["LCP", "INP", "CLS", "FCP"] as const)
      .map(
        (
          metric,
        ) => `SELECT '${metric}', quantile(0.75)(toFloat(properties.$web_vitals_${metric}_value)), count()
        FROM events WHERE ${eventFilter} AND event = '$web_vitals'
        AND properties.$web_vitals_${metric}_value IS NOT NULL`,
      )
      .join(" UNION ALL "),
  };
}

const queryResponse = z.object({ results: z.array(z.array(z.unknown())) });
const numeric = z.union([z.number(), z.string().trim().min(1)]);
const count = numeric.pipe(z.coerce.number().finite().int().nonnegative());
const measurement = numeric.pipe(z.coerce.number().finite().nonnegative());
const percentage = numeric.pipe(z.coerce.number().finite().min(0).max(100));
const breakdownRows = z.array(z.tuple([z.string(), count]));

export class AnalyticsQueryError extends Error {}

export async function fetchAnalyticsReport(
  config: PostHogConfig,
  days: AnalyticsPeriod,
  options: { now?: Date; fetch?: typeof fetch } = {},
): Promise<AnalyticsReport> {
  const now = options.now ?? new Date();
  const request = options.fetch ?? fetch;
  const queries = buildAnalyticsQueries(days, config.siteOrigin, now);
  const endpoint = `${config.apiHost.replace(/\/$/, "")}/api/projects/${encodeURIComponent(config.projectId)}/query/`;

  async function runQuery(name: string, query: string) {
    let response: Response;
    try {
      response = await request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.personalApiKey}`,
        },
        body: JSON.stringify({
          name: `Gian admin analytics: ${name}`,
          query: { kind: "HogQLQuery", query },
          refresh: "blocking",
          async: false,
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new AnalyticsQueryError(
        "PostHog ist gerade nicht erreichbar. Bitte später erneut versuchen.",
      );
    }
    if (!response.ok) {
      // Never forward upstream error bodies, SQL, or credentials to the browser.
      const message =
        response.status === 401 || response.status === 403
          ? "PostHog-Zugriff verweigert. API-Schlüssel und Projektberechtigung prüfen."
          : response.status === 429
            ? "PostHog-Abfragelimit erreicht. Bitte später erneut versuchen."
            : "Die PostHog-Daten konnten nicht geladen werden. Bitte die Projektkonfiguration prüfen.";
      throw new AnalyticsQueryError(message);
    }
    try {
      return queryResponse.parse(await response.json()).results;
    } catch {
      throw new AnalyticsQueryError(
        "PostHog hat keine gültigen Analysedaten geliefert.",
      );
    }
  }

  const names = Object.keys(queries) as (keyof typeof queries)[];
  const responses = await Promise.allSettled(
    names.map((name) => runQuery(name, queries[name])),
  );
  const rows = {} as Record<keyof typeof queries, unknown[][]>;
  for (const [index, result] of responses.entries()) {
    if (result.status === "rejected") throw result.reason as unknown;
    rows[names[index]!] = result.value;
  }

  try {
    const [visitors, pageviewCount] = z
      .tuple([count, count])
      .parse(rows.summary[0]);
    const [sessionCount, bounceRate, duration] = z
      .tuple([count, percentage.nullable(), measurement.nullable()])
      .parse(rows.sessions[0]);
    const daily = z
      .array(z.tuple([z.string(), count, count]))
      .parse(rows.daily);
    const dailyMap = new Map(
      daily.map(([date, visitors, pageviews]) => [
        date,
        { visitors, pageviews },
      ]),
    );
    const breakdown = (
      name: "pages" | "sources" | "campaigns" | "countries" | "devices",
    ) =>
      breakdownRows.parse(rows[name]).map(([name, count]) => ({ name, count }));
    const vitals: WebVital[] = z
      .array(
        z.tuple([z.enum(["LCP", "INP", "CLS", "FCP"]), z.unknown(), count]),
      )
      .parse(rows.vitals)
      .map(([name, value, samples]) => ({
        name,
        value: samples ? measurement.parse(value) : null,
        samples,
      }));
    if (
      vitals.length !== 4 ||
      new Set(vitals.map((vital) => vital.name)).size !== 4
    ) {
      throw new Error("Incomplete web vitals");
    }

    return {
      days,
      updatedAt: now.toISOString(),
      visitors,
      pageviews: pageviewCount,
      sessions: sessionCount,
      bounceRate: sessionCount ? bounceRate : null,
      averageSessionDuration: sessionCount ? duration : null,
      daily: analyticsDates(days, now).map((date) => ({
        date,
        visitors: dailyMap.get(date)?.visitors ?? 0,
        pageviews: dailyMap.get(date)?.pageviews ?? 0,
      })),
      pages: breakdown("pages"),
      sources: breakdown("sources"),
      campaigns: breakdown("campaigns"),
      countries: breakdown("countries"),
      devices: breakdown("devices"),
      vitals,
    };
  } catch {
    throw new AnalyticsQueryError(
      "PostHog hat keine gültigen Analysedaten geliefert.",
    );
  }
}
