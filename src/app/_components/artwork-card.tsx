/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import type { GalleryItem } from "@/app/_lib/content-shared";

export function ArtworkCard({
  artwork,
  index,
}: {
  artwork: GalleryItem;
  index: number;
}) {
  return (
    <article className="artwork-card">
      <Link className="artwork-card__link" href={`/work/${artwork.slug}`}>
        <div className="artwork-card__image">
          <img
            alt={artwork.imageAlt}
            loading={index === 0 ? "eager" : "lazy"}
            src={artwork.imageUrl}
          />
        </div>
        <div className="artwork-card__meta">
          <div>
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
