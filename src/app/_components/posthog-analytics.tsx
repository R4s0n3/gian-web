"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { PostHog } from "posthog-js";

import { env } from "@/env";
import {
  analyticsUrl,
  isPublicAnalyticsPath,
  sanitizeAnalyticsProperties,
} from "@/lib/analytics";

let clientPromise: Promise<PostHog> | undefined;

function loadClient() {
  clientPromise ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-05-30",
      // Route changes are captured explicitly to exclude administration.
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ["click"],
        capture_copied_text: false,
        url_ignorelist: [/^https?:\/\/[^/]+\/(admin|api)(\/|$|\?)/],
      },
      capture_performance: { web_vitals: true, network_timing: false },
      person_profiles: "never",
      disable_session_recording: true,
      disable_surveys: true,
      disable_conversations: true,
      disable_product_tours: true,
      advanced_disable_feature_flags: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      mask_all_text: true,
      mask_all_element_attributes: true,
      respect_dnt: true,
      before_send: (event) => {
        if (!event) return null;
        const properties: Record<string, unknown> = event.properties;
        const currentUrl = properties.$current_url;
        if (typeof currentUrl !== "string") return null;
        try {
          const url = new URL(currentUrl);
          if (
            url.origin !== new URL(env.NEXT_PUBLIC_SITE_URL!).origin ||
            !isPublicAnalyticsPath(url.pathname)
          ) {
            return null;
          }
        } catch {
          return null;
        }
        // Also covers nested web-vital payloads and autocaptured link URLs.
        event.properties = {
          ...sanitizeAnalyticsProperties(properties),
          $pathname: new URL(currentUrl).pathname,
          site_origin: new URL(env.NEXT_PUBLIC_SITE_URL!).origin,
        };
        return event;
      },
    });
    return posthog;
  });
  return clientPromise;
}

export function PostHogAnalytics() {
  const pathname = usePathname();
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    if (!isPublicAnalyticsPath(pathname)) {
      lastPage.current = null;
      return;
    }
    if (
      !env.NEXT_PUBLIC_POSTHOG_KEY ||
      !env.NEXT_PUBLIC_POSTHOG_HOST ||
      !env.NEXT_PUBLIC_SITE_URL ||
      window.location.origin !== new URL(env.NEXT_PUBLIC_SITE_URL).origin
    ) {
      return;
    }

    let cancelled = false;
    void loadClient()
      .then((posthog) => {
        if (cancelled || lastPage.current === pathname) return;
        lastPage.current = pathname;
        posthog.capture("$pageview", {
          $current_url: analyticsUrl(window.location.href),
          $pathname: pathname,
        });
      })
      .catch(() => {
        // Analytics must never interrupt the visitor experience.
        clientPromise = undefined;
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
