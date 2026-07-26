import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const galleryPosts = [
  {
    slug: "threshold-i",
    title: "Threshold I",
    excerpt:
      "Eine Studie über Licht, das sich am Rand eines Durchgangs sammelt.",
    description:
      "Threshold I erforscht den Moment, in dem ein Innenraum in eine unbekannte Landschaft übergeht.",
    imageUrl: "/artworks/threshold-i.webp",
    imageAlt: "Abstrakte Arbeit mit dem Titel Threshold I",
    medium: "Mixed Media auf Leinwand",
    dimensions: "100 × 80 cm",
    year: 2025,
    featured: true,
    published: true,
    sortOrder: 10,
    publishedAt: new Date("2025-01-10T12:00:00.000Z"),
  },
  {
    slug: "blue-reliquary",
    title: "Blue Reliquary",
    excerpt: "Ein imaginäres Gefäß, das Spuren von Erinnerung in Blau bewahrt.",
    description:
      "Blue Reliquary schichtet leuchtende Pigmente und verwitterte Formen zu einem stillen Andachtsobjekt.",
    imageUrl: "/artworks/blue-reliquary.webp",
    imageAlt: "Blaue abstrakte Arbeit mit dem Titel Blue Reliquary",
    medium: "Öl und Kaltwachs auf Holz",
    dimensions: "80 × 60 cm",
    year: 2025,
    featured: true,
    published: true,
    sortOrder: 20,
    publishedAt: new Date("2025-02-14T12:00:00.000Z"),
  },
  {
    slug: "signal-bloom",
    title: "Signal Bloom",
    excerpt: "Ein strahlendes Signal, das organische Form annimmt.",
    description:
      "Signal Bloom verbindet elektronischen Rhythmus und botanisches Wachstum in einem Feld gesättigter Farbe.",
    imageUrl: "/artworks/signal-bloom.webp",
    imageAlt: "Farbige abstrakte Arbeit mit dem Titel Signal Bloom",
    medium: "Acryl und Pigment auf Leinwand",
    dimensions: "120 × 90 cm",
    year: 2026,
    featured: false,
    published: true,
    sortOrder: 30,
    publishedAt: new Date("2026-01-16T12:00:00.000Z"),
  },
] as const;

const products = [
  {
    slug: "threshold-i-archival-print",
    name: "Threshold I — Archivdruck",
    description:
      "Signierter Giclée-Druck in Museumsqualität auf schwerem Baumwollpapier.",
    imageUrl: "/artworks/threshold-i.webp",
    priceCents: 8500,
    currency: "EUR",
    active: true,
    inventory: 25,
    sortOrder: 10,
  },
  {
    slug: "blue-reliquary-archival-print",
    name: "Blue Reliquary — Archivdruck",
    description:
      "Signierter Giclée-Druck in Museumsqualität auf schwerem Baumwollpapier.",
    imageUrl: "/artworks/blue-reliquary.webp",
    priceCents: 8500,
    currency: "EUR",
    active: true,
    inventory: 25,
    sortOrder: 20,
  },
  {
    slug: "signal-bloom-archival-print",
    name: "Signal Bloom — Archivdruck",
    description:
      "Signierter, limitierter Giclée-Druck auf schwerem Baumwollpapier.",
    imageUrl: "/artworks/signal-bloom.webp",
    priceCents: 11000,
    currency: "EUR",
    active: true,
    inventory: 15,
    sortOrder: 30,
  },
] as const;

async function main() {
  await prisma.$transaction([
    ...galleryPosts.map(({ slug, ...data }) =>
      prisma.galleryPost.upsert({
        where: { slug },
        // Seeds are create-only: never overwrite work curated in the dashboard.
        update: {},
        create: { slug, ...data },
      }),
    ),
    ...products.map(({ slug, ...data }) =>
      prisma.product.upsert({
        where: { slug },
        // In particular, a repeated seed must never reset sold inventory.
        update: {},
        create: { slug, ...data },
      }),
    ),
  ]);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
