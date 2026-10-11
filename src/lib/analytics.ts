export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export type AnalyticsBreakdown = { name: string; count: number };
export type WebVital = {
  name: "LCP" | "INP" | "CLS" | "FCP";
  value: number | null;
  samples: number;
};

export type AnalyticsReport = {
  days: AnalyticsPeriod;
  updatedAt: string;
  visitors: number;
  pageviews: number;
  sessions: number;
  bounceRate: number | null;
  averageSessionDuration: number | null;
  daily: { date: string; visitors: number; pageviews: number }[];
  pages: AnalyticsBreakdown[];
  sources: AnalyticsBreakdown[];
  campaigns: AnalyticsBreakdown[];
  countries: AnalyticsBreakdown[];
  devices: AnalyticsBreakdown[];
  vitals: WebVital[];
};

export function isPublicAnalyticsPath(pathname: string) {
  return !/^\/(admin|api)(\/|$)/.test(pathname);
}

// Keep attribution, but never transmit checkout session IDs, emails, or hashes.
const campaignParameters = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

export function analyticsUrl(value: string, keepCampaign = true) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.username = "";
    url.password = "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (!keepCampaign || !campaignParameters.has(key)) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return "";
  }
}

export function sanitizeAnalyticsProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (typeof value === "string" && /url|href|referrer/i.test(key)) {
        return [key, analyticsUrl(value, !/referrer/i.test(key))];
      }
      if (Array.isArray(value)) {
        return [
          key,
          value.map((item: unknown) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? sanitizeAnalyticsProperties(item as Record<string, unknown>)
              : item,
          ),
        ];
      }
      if (value && typeof value === "object") {
        return [
          key,
          sanitizeAnalyticsProperties(value as Record<string, unknown>),
        ];
      }
      return [key, value];
    }),
  );
}

export function analyticsDates(days: AnalyticsPeriod, now: Date) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function webVitalRating(vital: WebVital) {
  if (vital.value === null)
    return { label: "Noch keine Messung", status: "empty" };
  const thresholds = {
    LCP: [2500, 4000],
    INP: [200, 500],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
  } as const;
  const [good, poor] = thresholds[vital.name];
  if (vital.value <= good) return { label: "Gut", status: "good" };
  if (vital.value <= poor) return { label: "Verbesserbar", status: "fair" };
  return { label: "Langsam / instabil", status: "poor" };
}
