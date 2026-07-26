import "server-only";

import { cache } from "react";

import type { GalleryItem, ProductItem } from "@/app/_lib/content-shared";
import { api } from "@/trpc/server";

const fallbackGallery: GalleryItem[] = [
  {
    id: "fallback-threshold-i",
    slug: "threshold-i",
    title: "Threshold I",
    excerpt:
      "A scorched passage held between architectural memory and a living mark.",
    description:
      "Threshold I studies the point where structure gives way to instinct. Scraped bone tones, an ember core, and repeated mechanical traces hold the image in a state between invitation and warning.",
    imageUrl: "/artworks/threshold-i.webp",
    imageAlt:
      "Abstract dark mixed-media artwork with a bone-colored arch and ember-red doorway",
    medium: "Mixed media on panel",
    dimensions: "112 × 140 cm",
    year: "2026",
    featured: true,
    sortOrder: 0,
  },
  {
    id: "fallback-signal-bloom",
    slug: "signal-bloom",
    title: "Signal Bloom",
    excerpt:
      "Ochre growth, blackened ground, and a signal taking root like a remembered organism.",
    description:
      "Signal Bloom treats transmission as something physical. Botanical traces rise through an ochre field and scorched black ground, creating a frequency that feels excavated, organic, and insistently alive.",
    imageUrl: "/artworks/signal-bloom.webp",
    imageAlt:
      "Ochre and black abstract artwork with pale botanical, root-like markings",
    medium: "Pigment, charcoal & oil",
    dimensions: "90 × 120 cm",
    year: "2026",
    featured: true,
    sortOrder: 1,
  },
  {
    id: "fallback-blue-reliquary",
    slug: "blue-reliquary",
    title: "Blue Reliquary",
    excerpt:
      "A vessel for fragments: devotional geometry disturbed by hand-made noise.",
    description:
      "Blue Reliquary holds a collection of visual remnants inside a strict, saturated field. The work borrows the posture of a devotional object while refusing a single stable symbol.",
    imageUrl: "/artworks/blue-reliquary.webp",
    imageAlt:
      "Dark contemporary artwork dominated by cobalt blue and pale ritual-like linework",
    medium: "Acrylic & transfer on canvas",
    dimensions: "100 × 125 cm",
    year: "2025",
    featured: false,
    sortOrder: 2,
  },
];

const fallbackProducts: ProductItem[] = [
  {
    id: "fallback-print-threshold",
    slug: "threshold-i-archival-print",
    name: "Threshold I / Archival print",
    description: "Numbered pigment print on 310gsm cotton rag. Edition of 25.",
    imageUrl: "/artworks/threshold-i.webp",
    priceCents: 14500,
    currency: "EUR",
    inventory: 25,
    sortOrder: 0,
  },
  {
    id: "fallback-print-signal",
    slug: "signal-bloom-study",
    name: "Signal Bloom / Studio study",
    description:
      "Signed A3 studio edition with hand-finished ochre and charcoal details.",
    imageUrl: "/artworks/signal-bloom.webp",
    priceCents: 8500,
    currency: "EUR",
    inventory: 40,
    sortOrder: 1,
  },
  {
    id: "fallback-reliquary-object",
    slug: "blue-reliquary-object",
    name: "Blue Reliquary / Object 01",
    description:
      "Small-batch cast object, individually marked and boxed by the studio.",
    imageUrl: "/artworks/blue-reliquary.webp",
    priceCents: 22000,
    currency: "EUR",
    inventory: 8,
    sortOrder: 2,
  },
];

function normalizeGallery(
  row: Awaited<ReturnType<typeof api.gallery.publicList>>[number],
): GalleryItem {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    excerpt:
      row.excerpt ??
      row.description ??
      "An original work from Gian’s current studio practice.",
    description:
      row.description ??
      row.excerpt ??
      "An original work from Gian’s current studio practice.",
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    medium: row.medium ?? "Mixed media",
    dimensions: row.dimensions ?? "Unique work",
    year: row.year?.toString() ?? "Current",
    featured: row.featured,
    sortOrder: row.sortOrder,
  };
}

function normalizeProduct(
  row: Awaited<ReturnType<typeof api.product.publicList>>[number],
): ProductItem {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    description:
      row.description ?? "A limited studio edition, prepared by Gian.",
    imageUrl: row.imageUrl ?? "/artworks/blue-reliquary.webp",
    priceCents: row.priceCents,
    currency: row.currency,
    inventory: row.inventory,
    sortOrder: row.sortOrder,
  };
}

export const getPublicGallery = cache(async (): Promise<GalleryItem[]> => {
  try {
    const rows = await api.gallery.publicList();
    return rows.map(normalizeGallery);
  } catch {
    // Bundled work is a development preview, never a production outage mask.
    return process.env.NODE_ENV === "production" ? [] : fallbackGallery;
  }
});

export const getPublicProducts = cache(async (): Promise<ProductItem[]> => {
  try {
    const rows = await api.product.publicList();
    return rows.map(normalizeProduct);
  } catch {
    // Never advertise preview inventory when production data is unavailable.
    return process.env.NODE_ENV === "production" ? [] : fallbackProducts;
  }
});
