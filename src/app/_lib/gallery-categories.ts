import type { GalleryCategory } from "@/app/_lib/content-shared";

type GalleryCategoryPresentation = {
  archiveHref: string;
  singular: string;
  plural: string;
  nextLabel: string;
  className: string;
};

export const galleryCategoryPresentation = {
  PAINTING: {
    archiveHref: "/gemaelde",
    singular: "Gemälde",
    plural: "Gemälde",
    nextLabel: "Nächstes Gemälde",
    className: "painting",
  },
  PHOTOGRAPHY: {
    archiveHref: "/fotografien",
    singular: "Fotografie",
    plural: "Fotografien",
    nextLabel: "Nächste Fotografie",
    className: "photography",
  },
} satisfies Record<GalleryCategory, GalleryCategoryPresentation>;
