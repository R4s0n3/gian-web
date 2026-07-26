import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const galleryPosts = [
  {
    slug: "threshold-i",
    title: "Threshold I",
    excerpt: "A study of light gathering at the edge of a passage.",
    description:
      "Threshold I explores the moment where an interior gives way to an unknown landscape.",
    imageUrl: "/artworks/threshold-i.webp",
    imageAlt: "Abstract artwork titled Threshold I",
    medium: "Mixed media on canvas",
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
    excerpt: "An imagined vessel holding traces of memory in blue.",
    description:
      "Blue Reliquary layers luminous pigment and weathered forms into a quiet, devotional object.",
    imageUrl: "/artworks/blue-reliquary.webp",
    imageAlt: "Blue abstract artwork titled Blue Reliquary",
    medium: "Oil and cold wax on panel",
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
    excerpt: "A radiant signal taking organic form.",
    description:
      "Signal Bloom brings electronic rhythm and botanical growth together in a field of saturated color.",
    imageUrl: "/artworks/signal-bloom.webp",
    imageAlt: "Colorful abstract artwork titled Signal Bloom",
    medium: "Acrylic and pigment on canvas",
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
    name: "Threshold I — Archival Print",
    description:
      "Signed, museum-quality giclée print on heavyweight cotton paper.",
    imageUrl: "/artworks/threshold-i.webp",
    priceCents: 8500,
    currency: "EUR",
    active: true,
    inventory: 25,
    sortOrder: 10,
  },
  {
    slug: "blue-reliquary-archival-print",
    name: "Blue Reliquary — Archival Print",
    description:
      "Signed, museum-quality giclée print on heavyweight cotton paper.",
    imageUrl: "/artworks/blue-reliquary.webp",
    priceCents: 8500,
    currency: "EUR",
    active: true,
    inventory: 25,
    sortOrder: 20,
  },
  {
    slug: "signal-bloom-archival-print",
    name: "Signal Bloom — Archival Print",
    description:
      "Signed, limited-edition giclée print on heavyweight cotton paper.",
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
