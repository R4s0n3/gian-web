import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  normalizePublicSiteSettings,
  parseHeroImages,
} from "@/app/_lib/content-shared";

import { siteSettingsUpdateSchema } from "./site-settings-schema";

void describe("siteSettingsUpdateSchema", () => {
  void test("accepts an ordered image list and trims its fields", () => {
    assert.deepEqual(
      siteSettingsUpdateSchema.parse({
        heroImages: [
          {
            url: "  https://media.example.com/hero.webp  ",
            alt: "  Der Künstler in seinem Atelier  ",
          },
          {
            url: "https://media.example.com/hero-detail.webp",
            alt: "Detailansicht des Ateliers",
          },
        ],
      }),
      {
        heroImages: [
          {
            url: "https://media.example.com/hero.webp",
            alt: "Der Künstler in seinem Atelier",
          },
          {
            url: "https://media.example.com/hero-detail.webp",
            alt: "Detailansicht des Ateliers",
          },
        ],
      },
    );
  });

  void test("accepts an empty list to clear the carousel", () => {
    assert.deepEqual(
      siteSettingsUpdateSchema.parse({
        heroImages: [],
      }),
      {
        heroImages: [],
      },
    );
  });

  void test("rejects an image without both a URL and alt text", () => {
    const result = siteSettingsUpdateSchema.safeParse({
      heroImages: [
        {
          url: "https://media.example.com/hero.webp",
          alt: "",
        },
      ],
    });

    assert.equal(result.success, false);
  });

  void test("rejects more than ten images", () => {
    const result = siteSettingsUpdateSchema.safeParse({
      heroImages: Array.from({ length: 11 }, (_, index) => ({
        url: `https://media.example.com/hero-${index}.webp`,
        alt: `Hero-Bild ${index}`,
      })),
    });

    assert.equal(result.success, false);
  });
});

void describe("hero image normalization", () => {
  void test("preserves valid image order and drops malformed values", () => {
    assert.deepEqual(
      parseHeroImages([
        { url: "  /hero-one.webp ", alt: " Hero eins " },
        { url: "/missing-alt.webp" },
        null,
        { url: "/hero-two.webp", alt: "Hero zwei" },
      ]),
      [
        { url: "/hero-one.webp", alt: "Hero eins" },
        { url: "/hero-two.webp", alt: "Hero zwei" },
      ],
    );
  });

  void test("uses a complete legacy pair when the JSON list is empty", () => {
    assert.deepEqual(
      normalizePublicSiteSettings({
        heroImages: [],
        heroImageUrl: "/legacy-hero.webp",
        heroImageAlt: "Legacy-Hero",
      }),
      {
        heroImages: [{ url: "/legacy-hero.webp", alt: "Legacy-Hero" }],
        heroImageUrl: "/legacy-hero.webp",
        heroImageAlt: "Legacy-Hero",
      },
    );
  });

  void test("treats JSON as authoritative and synchronizes the legacy view", () => {
    assert.deepEqual(
      normalizePublicSiteSettings({
        heroImages: [{ url: "/current.webp", alt: "Aktuelles Hero" }],
        heroImageUrl: "/stale.webp",
        heroImageAlt: "Veraltetes Hero",
      }),
      {
        heroImages: [{ url: "/current.webp", alt: "Aktuelles Hero" }],
        heroImageUrl: "/current.webp",
        heroImageAlt: "Aktuelles Hero",
      },
    );
  });

  void test("keeps an intentionally cleared setting empty", () => {
    assert.deepEqual(
      normalizePublicSiteSettings({
        heroImages: [],
        heroImageUrl: null,
        heroImageAlt: null,
      }),
      {
        heroImages: [],
        heroImageUrl: null,
        heroImageAlt: null,
      },
    );
  });
});
