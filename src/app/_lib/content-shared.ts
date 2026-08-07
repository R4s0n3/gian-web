export type GalleryImage = {
  url: string;
  alt: string;
};

export const GALLERY_CATEGORIES = [
  "PAINTING",
  "PHOTOGRAPHY",
  "COMMISSION",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export function parseGalleryImages(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return [];

  const images: unknown[] = value;

  return images.flatMap((image) => {
    if (
      typeof image === "object" &&
      image !== null &&
      "url" in image &&
      "alt" in image &&
      typeof image.url === "string" &&
      typeof image.alt === "string"
    ) {
      return [{ url: image.url, alt: image.alt }];
    }

    return [];
  });
}

export type GalleryItem = {
  id: string;
  slug: string;
  title: string;
  category: GalleryCategory;
  excerpt: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  images: GalleryImage[];
  medium: string;
  dimensions: string;
  year: string;
  featured: boolean;
  sortOrder: number;
};

export type PublicSiteSettings = {
  heroImageUrl: string | null;
  heroImageAlt: string | null;
};

export type ProductItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  inventory: number | null;
  sortOrder: number;
};

export function formatMoney(cents: number, currency: string, locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
