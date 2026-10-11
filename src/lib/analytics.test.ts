import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  analyticsDates,
  analyticsUrl,
  isPublicAnalyticsPath,
  sanitizeAnalyticsProperties,
  webVitalRating,
} from "./analytics";

void describe("public analytics capture", () => {
  void test("excludes admin and API routes without excluding similarly named public routes", () => {
    for (const path of ["/admin", "/admin/login", "/api", "/api/trpc"]) {
      assert.equal(isPublicAnalyticsPath(path), false);
    }
    for (const path of [
      "/",
      "/shop",
      "/work/test",
      "/administrator",
      "/apiary",
    ]) {
      assert.equal(isPublicAnalyticsPath(path), true);
    }
  });

  void test("preserves campaign attribution and strips checkout IDs, emails, credentials and fragments", () => {
    assert.equal(
      analyticsUrl(
        "https://user:password@studio.example/checkout/success?session_id=cs_secret&email=private%40example.com&utm_source=instagram&utm_campaign=launch#private",
      ),
      "https://studio.example/checkout/success?utm_source=instagram&utm_campaign=launch",
    );
    assert.equal(analyticsUrl("mailto:private@example.com"), "");
    assert.equal(analyticsUrl("javascript:alert(1)"), "");
    assert.equal(analyticsUrl("not a URL"), "");
  });

  void test("sanitizes nested vitals and referrers without changing numerical measurements", () => {
    const source = {
      $current_url:
        "https://studio.example/shop?session_id=secret&utm_source=newsletter",
      $referrer: "https://search.example/find?email=private&utm_source=private",
      $web_vitals_CLS_value: 0,
      $web_vitals_LCP_event: {
        value: 1234,
        $current_url: "https://studio.example/shop?session_id=secret",
        attribution: {
          url: "https://studio.example/image.png?signature=secret",
        },
      },
      $elements: [{ attr__href: "https://studio.example/shop?email=private" }],
    };
    const clean = sanitizeAnalyticsProperties(source);
    assert.equal(
      clean.$current_url,
      "https://studio.example/shop?utm_source=newsletter",
    );
    assert.equal(clean.$referrer, "https://search.example/find");
    assert.equal(clean.$web_vitals_CLS_value, 0);
    assert.deepEqual(clean.$web_vitals_LCP_event, {
      value: 1234,
      $current_url: "https://studio.example/shop",
      attribution: { url: "https://studio.example/image.png" },
    });
    assert.deepEqual(clean.$elements, [
      { attr__href: "https://studio.example/shop" },
    ]);
    assert.ok(
      JSON.stringify(source).includes("session_id=secret"),
      "does not mutate input",
    );
  });
});

void describe("analytics time windows and vitals", () => {
  void test("fills calendar dates across month and year boundaries in UTC", () => {
    assert.deepEqual(analyticsDates(7, new Date("2026-01-03T23:30:00Z")), [
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    assert.equal(
      analyticsDates(90, new Date("2026-10-11T12:00:00Z")).length,
      90,
    );
  });

  void test("distinguishes zero CLS, missing INP, and rating boundaries", () => {
    assert.equal(
      webVitalRating({ name: "CLS", value: 0, samples: 10 }).status,
      "good",
    );
    assert.equal(
      webVitalRating({ name: "INP", value: null, samples: 0 }).status,
      "empty",
    );
    assert.equal(
      webVitalRating({ name: "INP", value: 200, samples: 1 }).status,
      "good",
    );
    assert.equal(
      webVitalRating({ name: "LCP", value: 2501, samples: 1 }).status,
      "fair",
    );
    assert.equal(
      webVitalRating({ name: "LCP", value: 4001, samples: 1 }).status,
      "poor",
    );
  });
});
