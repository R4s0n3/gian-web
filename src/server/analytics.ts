import "server-only";

import { env } from "@/env";
import type { AnalyticsPeriod, AnalyticsReport } from "@/lib/analytics";
import { fetchAnalyticsReport } from "@/lib/posthog-report";

const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<
  AnalyticsPeriod,
  { report: AnalyticsReport; expires: number }
>();
const pending = new Map<AnalyticsPeriod, Promise<AnalyticsReport>>();

export async function getAnalyticsReport(days: AnalyticsPeriod) {
  if (
    !env.NEXT_PUBLIC_POSTHOG_KEY ||
    !env.NEXT_PUBLIC_POSTHOG_HOST ||
    !env.NEXT_PUBLIC_SITE_URL ||
    !env.POSTHOG_PROJECT_ID ||
    !env.POSTHOG_PERSONAL_API_KEY ||
    !env.POSTHOG_API_HOST
  ) {
    return { configured: false as const };
  }

  const cached = cache.get(days);
  if (cached && cached.expires > Date.now()) {
    return { configured: true as const, report: cached.report };
  }

  let task = pending.get(days);
  if (!task) {
    task = fetchAnalyticsReport(
      {
        apiHost: env.POSTHOG_API_HOST,
        projectId: env.POSTHOG_PROJECT_ID,
        personalApiKey: env.POSTHOG_PERSONAL_API_KEY,
        siteOrigin: new URL(env.NEXT_PUBLIC_SITE_URL).origin,
      },
      days,
    ).then((report) => {
      cache.set(days, { report, expires: Date.now() + CACHE_MS });
      return report;
    });
    pending.set(days, task);
  }

  try {
    return { configured: true as const, report: await task };
  } finally {
    pending.delete(days);
  }
}
