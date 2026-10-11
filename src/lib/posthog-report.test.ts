import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { z } from "zod";

import {
  AnalyticsQueryError,
  buildAnalyticsQueries,
  fetchAnalyticsReport,
} from "./posthog-report";

const config = {
  apiHost: "https://eu.posthog.com",
  projectId: "12345",
  personalApiKey: "test-server-secret",
  siteOrigin: "https://studio.example",
};
const now = new Date("2026-10-11T12:34:56Z");
const requestBody = z.object({
  name: z.string(),
  query: z.object({ kind: z.literal("HogQLQuery"), query: z.string() }),
  refresh: z.literal("blocking"),
  async: z.literal(false),
});

function fixtures(): Record<string, unknown[][]> {
  return {
    summary: [[4, 12]],
    sessions: [[5, 40, 65.5]],
    daily: [
      ["2026-10-09", 1, 3],
      ["2026-10-11", 3, 9],
    ],
    pages: [
      ["/", 8],
      ["/shop", 4],
    ],
    sources: [
      ["instagram", 3],
      ["Direkt", 2],
    ],
    campaigns: [["launch", 3]],
    countries: [
      ["DE", 3],
      ["Unbekannt", 1],
    ],
    devices: [["Mobile", 4]],
    vitals: [
      ["LCP", 2300, 10],
      ["INP", null, 0],
      ["CLS", 0, 10],
      ["FCP", 1200, 10],
    ],
  };
}

function mockPostHog(
  data: Record<string, unknown[][]>,
  inspect?: (
    url: string,
    init: RequestInit,
    body: z.infer<typeof requestBody>,
  ) => void,
): typeof fetch {
  return async (input, init) => {
    assert.ok(init);
    assert.equal(typeof init.body, "string");
    const body = requestBody.parse(JSON.parse(init.body as string) as unknown);
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    inspect?.(url, init, body);
    const name = body.name.replace("Gian admin analytics: ", "");
    assert.ok(name in data, `Unexpected query ${name}`);
    return Response.json({ results: data[name] });
  };
}

void describe("PostHog dashboard queries", () => {
  void test("bounds each query to the canonical site and selected period", () => {
    const queries = buildAnalyticsQueries(7, config.siteOrigin, now);
    for (const query of Object.values(queries)) {
      assert.match(query, /2026-10-05 00:00:00/);
      assert.match(query, /2026-10-11 12:34:56/);
      assert.ok(query.includes(config.siteOrigin));
    }
    assert.match(queries.sessions, /avg\(\$is_bounce\)/);
    assert.match(queries.sessions, /\$entry_pathname NOT LIKE '\/admin\/%'/);
    assert.match(queries.sources, /\$entry_utm_source/);
    assert.match(queries.vitals, /quantile\(0.75\)/);
    for (const name of [
      "pages",
      "sources",
      "campaigns",
      "countries",
      "devices",
    ] as const) {
      assert.match(queries[name], /LIMIT 10$/);
    }
  });

  void test("sends credentials only to the private API and produces a complete report", async () => {
    let requests = 0;
    const report = await fetchAnalyticsReport(config, 7, {
      now,
      fetch: mockPostHog(fixtures(), (url, init) => {
        requests++;
        assert.equal(url, "https://eu.posthog.com/api/projects/12345/query/");
        assert.equal(
          new Headers(init.headers).get("Authorization"),
          "Bearer test-server-secret",
        );
        assert.equal(init.method, "POST");
        assert.equal(init.cache, "no-store");
        assert.equal(init.redirect, "error");
        assert.ok(init.signal);
      }),
    });
    assert.equal(requests, 9);
    assert.equal(report.visitors, 4);
    assert.equal(report.pageviews, 12);
    assert.equal(report.bounceRate, 40);
    assert.equal(report.averageSessionDuration, 65.5);
    assert.equal(report.daily.length, 7);
    assert.deepEqual(report.daily[0], {
      date: "2026-10-05",
      visitors: 0,
      pageviews: 0,
    });
    assert.deepEqual(report.daily.at(-1), {
      date: "2026-10-11",
      visitors: 3,
      pageviews: 9,
    });
    assert.deepEqual(
      report.vitals.find((vital) => vital.name === "CLS"),
      { name: "CLS", value: 0, samples: 10 },
    );
    assert.deepEqual(
      report.vitals.find((vital) => vital.name === "INP"),
      { name: "INP", value: null, samples: 0 },
    );
    assert.ok(!JSON.stringify(report).includes(config.personalApiKey));
  });

  void test("handles a new project without inventing bounce or vital measurements", async () => {
    const data = fixtures();
    data.summary = [[0, 0]];
    data.sessions = [[0, null, null]];
    data.daily = [];
    for (const name of [
      "pages",
      "sources",
      "countries",
      "devices",
      "campaigns",
    ])
      data[name] = [];
    data.vitals = ["LCP", "INP", "CLS", "FCP"].map((name) => [name, null, 0]);
    const report = await fetchAnalyticsReport(config, 30, {
      now,
      fetch: mockPostHog(data),
    });
    assert.equal(report.bounceRate, null);
    assert.equal(report.averageSessionDuration, null);
    assert.equal(report.daily.length, 30);
    assert.ok(
      report.daily.every((day) => day.visitors === 0 && day.pageviews === 0),
    );
    assert.ok(report.vitals.every((vital) => vital.value === null));
  });

  void test("rejects malformed results and missing measurements instead of reporting zero", async () => {
    for (const invalid of [undefined, [[null, 12]], [["invalid", 12]]]) {
      const data = fixtures();
      if (invalid === undefined) delete data.summary;
      else data.summary = invalid;
      await assert.rejects(
        fetchAnalyticsReport(config, 7, {
          now,
          fetch: async () => Response.json({ results: data.summary }),
        }),
        AnalyticsQueryError,
      );
    }
    const data = fixtures();
    data.vitals = [
      ["LCP", null, 10],
      ["INP", null, 0],
      ["CLS", 0, 10],
      ["FCP", 1200, 10],
    ];
    await assert.rejects(
      fetchAnalyticsReport(config, 7, { now, fetch: mockPostHog(data) }),
      AnalyticsQueryError,
    );
  });

  void test("sanitizes authentication, rate-limit, and upstream errors", async () => {
    for (const [status, expected] of [
      [403, /Zugriff verweigert/],
      [429, /Abfragelimit/],
      [500, /nicht geladen/],
    ] as const) {
      await assert.rejects(
        fetchAnalyticsReport(config, 7, {
          now,
          fetch: async () =>
            new Response(`private upstream body: ${config.personalApiKey}`, {
              status,
            }),
        }),
        (error: unknown) => {
          assert.ok(error instanceof AnalyticsQueryError);
          assert.match(error.message, expected);
          assert.ok(!error.message.includes(config.personalApiKey));
          return true;
        },
      );
    }
  });

  void test("handles network failures with a retryable message", async () => {
    await assert.rejects(
      fetchAnalyticsReport(config, 7, {
        now,
        fetch: async () => {
          throw new Error("network detail containing private data");
        },
      }),
      /gerade nicht erreichbar/,
    );
  });
});
