export type GalleryItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  medium: string;
  dimensions: string;
  year: string;
  featured: boolean;
  sortOrder: number;
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

export function formatMoney(cents: number, currency: string, locale = "en") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
