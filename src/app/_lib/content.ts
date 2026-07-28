import "server-only";

import { cache } from "react";

import type { GalleryItem, ProductItem } from "@/app/_lib/content-shared";
import { parseGalleryImages } from "@/app/_lib/content-shared";
import { api } from "@/trpc/server";

const fallbackGallery: GalleryItem[] = [
  {
    id: "fallback-threshold-i",
    slug: "threshold-i",
    title: "Threshold I",
    excerpt:
      "Ein versengter Durchgang zwischen architektonischer Erinnerung und lebendiger Spur.",
    description:
      "Threshold I untersucht den Punkt, an dem Struktur dem Instinkt weicht. Abgeschabte Knochentöne, ein glühender Kern und wiederkehrende mechanische Spuren halten das Bild zwischen Einladung und Warnung.",
    imageUrl: "/artworks/threshold-i.webp",
    imageAlt:
      "Dunkle abstrakte Mixed-Media-Arbeit mit knochenfarbenem Bogen und glutrotem Durchgang",
    images: [],
    medium: "Mixed Media auf Holz",
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
      "Ockerfarbenes Wachstum, geschwärzter Grund und ein Signal, das wie ein erinnerter Organismus Wurzeln schlägt.",
    description:
      "Signal Bloom begreift Übertragung als etwas Körperliches. Botanische Spuren steigen durch ein ockerfarbenes Feld und versengten schwarzen Grund und erzeugen eine Frequenz, die ausgegraben, organisch und beharrlich lebendig wirkt.",
    imageUrl: "/artworks/signal-bloom.webp",
    imageAlt:
      "Ockerfarbene und schwarze abstrakte Arbeit mit hellen botanischen, wurzelartigen Spuren",
    images: [],
    medium: "Pigment, Kohle & Öl",
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
      "Ein Gefäß für Fragmente: hingebungsvolle Geometrie, gestört von handgemachtem Rauschen.",
    description:
      "Blue Reliquary bewahrt visuelle Überreste in einem strengen, gesättigten Feld. Die Arbeit übernimmt die Haltung eines Andachtsobjekts und verweigert zugleich ein einzelnes stabiles Symbol.",
    imageUrl: "/artworks/blue-reliquary.webp",
    imageAlt:
      "Dunkle zeitgenössische Arbeit in Kobaltblau mit hellen, rituell anmutenden Linien",
    images: [],
    medium: "Acryl & Transfer auf Leinwand",
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
    name: "Threshold I / Archivdruck",
    description:
      "Nummerierter Pigmentdruck auf 310-g-Baumwollpapier. Auflage von 25.",
    imageUrl: "/artworks/threshold-i.webp",
    priceCents: 14500,
    currency: "EUR",
    inventory: 25,
    sortOrder: 0,
  },
  {
    id: "fallback-print-signal",
    slug: "signal-bloom-study",
    name: "Signal Bloom / Studiostudie",
    description:
      "Signierte A3-Studioedition mit handgearbeiteten Ocker- und Kohledetails.",
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
      "Gussobjekt in kleiner Auflage, im Studio einzeln markiert und verpackt.",
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
      "Eine Originalarbeit aus der aktuellen Studiopraxis von GIAN-LUCA.",
    description:
      row.description ??
      row.excerpt ??
      "Eine Originalarbeit aus der aktuellen Studiopraxis von GIAN-LUCA.",
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    images: parseGalleryImages(row.images),
    medium: row.medium ?? "Mixed Media",
    dimensions: row.dimensions ?? "Unikat",
    year: row.year?.toString() ?? "Aktuell",
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
      row.description ??
      "Eine limitierte, von GIAN-LUCA gefertigte Studio-Edition.",
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
