"use client";

/* eslint-disable @next/next/no-img-element */
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

import type { GalleryItem } from "@/app/_lib/content-shared";

type CategoryPreview = Pick<
  GalleryItem,
  "id" | "slug" | "title" | "imageUrl" | "imageAlt" | "medium" | "year"
>;

export function CategoryCarousel({
  artworks,
  category,
  description,
  href,
}: {
  artworks: CategoryPreview[];
  category: string;
  description: string;
  href: string;
}) {
  const previews = artworks.slice(0, 2);
  const slideCount = previews.length + 1;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });

  useEffect(() => {
    if (!emblaApi) return;

    const updateSelection = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    updateSelection();
    emblaApi.on("select", updateSelection);
    emblaApi.on("reInit", updateSelection);

    return () => {
      emblaApi.off("select", updateSelection);
      emblaApi.off("reInit", updateSelection);
    };
  }, [emblaApi]);

  const selectSlide = useCallback(
    (index: number) => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      emblaApi?.scrollTo(index, reducedMotion);
    },
    [emblaApi],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = Math.max(0, selectedIndex - 1);
        break;
      case "ArrowRight":
        nextIndex = Math.min(slideCount - 1, selectedIndex + 1);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = slideCount - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectSlide(nextIndex);
    event.currentTarget
      .querySelectorAll<HTMLButtonElement>(".category-carousel__dot")
      [nextIndex]?.focus({ preventScroll: true });
  };

  return (
    <article className="category-feature">
      <h3 className="category-feature__title">{category}</h3>

      <div
        aria-label={`${category} – Vorschau`}
        aria-roledescription="Karussell"
        className="category-carousel"
        onKeyDown={onKeyDown}
        role="region"
      >
        <div className="category-carousel__viewport" ref={emblaRef}>
          <div className="category-carousel__container">
            {previews.map((artwork, index) => (
              <div
                aria-hidden={selectedIndex !== index}
                aria-label={`${index + 1} von ${slideCount}`}
                aria-roledescription="Folie"
                className="category-carousel__slide"
                inert={selectedIndex !== index}
                key={artwork.id}
                role="group"
              >
                <Link
                  aria-label={`${artwork.title} ansehen`}
                  className="category-carousel__work"
                  draggable={false}
                  href={`/work/${artwork.slug}`}
                >
                  <div className="category-carousel__media">
                    <img
                      alt={artwork.imageAlt}
                      decoding="async"
                      draggable={false}
                      loading="lazy"
                      src={artwork.imageUrl}
                    />
                  </div>
                  <div className="category-carousel__caption">
                    <div>
                      <h4>{artwork.title}</h4>
                      <p>
                        {[artwork.medium, artwork.year]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span aria-hidden="true">↗</span>
                  </div>
                </Link>
              </div>
            ))}

            <div
              aria-hidden={selectedIndex !== previews.length}
              aria-label={`${slideCount} von ${slideCount}`}
              aria-roledescription="Folie"
              className="category-carousel__slide"
              inert={selectedIndex !== previews.length}
              role="group"
            >
              <Link
                className="category-carousel__archive"
                draggable={false}
                href={href}
              >
                <div className="category-carousel__media category-carousel__invitation">
                  <span
                    aria-hidden="true"
                    className="category-carousel__invitation-arrow"
                  >
                    ↗
                  </span>
                  <div>
                    <h4>Mehr entdecken.</h4>
                    <p>{description}</p>
                  </div>
                </div>
                <div className="category-carousel__caption category-carousel__archive-label">
                  <span>Alle {category} ansehen</span>
                  <span aria-hidden="true">→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {slideCount > 1 && (
          <div
            aria-label={`${category} – Karussell-Steuerung`}
            className="category-carousel__controls"
            role="group"
          >
            <button
              aria-label={`Vorherige Vorschau: ${category}`}
              className="category-carousel__arrow"
              disabled={selectedIndex === 0}
              onClick={() => selectSlide(selectedIndex - 1)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20 12H4m6-6-6 6 6 6" />
              </svg>
            </button>
            <div className="category-carousel__dots">
              {Array.from({ length: slideCount }, (_, index) => (
                <button
                  aria-current={selectedIndex === index}
                  aria-label={
                    index === previews.length
                      ? `${category}: Kategorie-Link anzeigen`
                      : `${category}: Vorschau ${index + 1} anzeigen`
                  }
                  className="category-carousel__dot"
                  key={index}
                  onClick={() => selectSlide(index)}
                  type="button"
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              aria-label={`Nächste Vorschau: ${category}`}
              className="category-carousel__arrow"
              disabled={selectedIndex === slideCount - 1}
              onClick={() => selectSlide(selectedIndex + 1)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 12h16m-6-6 6 6-6 6" />
              </svg>
            </button>
          </div>
        )}

        <span aria-live="polite" aria-atomic="true" className="sr-only">
          {category}: {selectedIndex + 1} von {slideCount}
        </span>
      </div>
    </article>
  );
}
