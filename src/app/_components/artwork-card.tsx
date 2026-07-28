/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import type { GalleryItem } from "@/app/_lib/content-shared";
import { galleryCategoryPresentation } from "@/app/_lib/gallery-categories";

export function ArtworkCard({
  artwork,
  index,
}: {
  artwork: GalleryItem;
  index: number;
}) {
  const category = galleryCategoryPresentation[artwork.category];

  return (
    <article
      className={`artwork-card artwork-card--${category.className}`}
      data-category={artwork.category}
    >
      <Link className="artwork-card__link" href={`/work/${artwork.slug}`}>
        <div
          className={`artwork-card__image artwork-card__image--${category.className}`}
        >
          <img
            alt={artwork.imageAlt}
            loading={index === 0 ? "eager" : "lazy"}
            src={artwork.imageUrl}
          />
        </div>
        <div className="artwork-card__meta">
          <div>
            <p className="artwork-card__category">{category.singular}</p>
            <h3 className="artwork-card__title">{artwork.title}</h3>
            <p className="artwork-card__details">
              {artwork.medium}, {artwork.year}
            </p>
          </div>
          <span className="artwork-card__number" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </Link>
    </article>
  );
}
