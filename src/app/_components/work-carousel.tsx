"use client";

/* eslint-disable @next/next/no-img-element */
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

import type { GalleryImage } from "@/app/_lib/content-shared";

export function WorkCarousel({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
  });
  const [navigation, setNavigation] = useState({
    selected: 0,
    count: 0,
    canScrollPrev: false,
    canScrollNext: false,
  });
  const [visibleSlides, setVisibleSlides] = useState([0]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateNavigation = () => {
      setNavigation({
        selected: emblaApi.selectedScrollSnap(),
        count: emblaApi.scrollSnapList().length,
        canScrollPrev: emblaApi.canScrollPrev(),
        canScrollNext: emblaApi.canScrollNext(),
      });
    };
    const updateVisibleSlides = () => {
      setVisibleSlides(emblaApi.slidesInView());
    };
    const updateCarousel = () => {
      updateNavigation();
      updateVisibleSlides();
    };

    updateCarousel();
    emblaApi.on("select", updateNavigation);
    emblaApi.on("reInit", updateCarousel);
    emblaApi.on("slidesInView", updateVisibleSlides);

    return () => {
      emblaApi.off("select", updateNavigation);
      emblaApi.off("reInit", updateCarousel);
      emblaApi.off("slidesInView", updateVisibleSlides);
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
    if (navigation.count <= 1) return;

    let nextIndex: number;
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = Math.max(0, navigation.selected - 1);
        break;
      case "ArrowRight":
        nextIndex = Math.min(navigation.count - 1, navigation.selected + 1);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = navigation.count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectSlide(nextIndex);
    event.currentTarget.focus({ preventScroll: true });
  };

  if (images.length === 0) return null;

  const canScroll = navigation.canScrollPrev || navigation.canScrollNext;

  return (
    <div
      aria-label={`${title} – Bilder`}
      aria-roledescription="Karussell"
      className={[
        "work-carousel",
        images.length === 1 && "work-carousel--single",
        canScroll && "work-carousel--scrollable",
      ]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={onKeyDown}
      role="region"
      tabIndex={canScroll ? 0 : undefined}
    >
      <div className="work-carousel__viewport" ref={emblaRef}>
        <div className="work-carousel__container">
          {images.map((image, index) => (
            <figure
              aria-hidden={!visibleSlides.includes(index)}
              aria-label={`Bild ${index + 1} von ${images.length}`}
              aria-roledescription="Folie"
              className="work-carousel__slide"
              key={`${image.url}-${index}`}
              role="group"
            >
              <img
                alt={image.alt}
                decoding="async"
                draggable={false}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                src={image.url}
              />
            </figure>
          ))}
        </div>
      </div>

      {canScroll && (
        <div
          aria-label="Bilder-Steuerung"
          className="work-carousel__controls"
          role="group"
        >
          <button
            aria-label="Vorherige Bildansicht"
            className="work-carousel__arrow"
            disabled={!navigation.canScrollPrev}
            onClick={() => selectSlide(navigation.selected - 1)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M20 12H4m6-6-6 6 6 6" />
            </svg>
          </button>
          <span aria-hidden="true" className="work-carousel__position">
            {navigation.selected + 1} / {navigation.count}
          </span>
          <button
            aria-label="Nächste Bildansicht"
            className="work-carousel__arrow"
            disabled={!navigation.canScrollNext}
            onClick={() => selectSlide(navigation.selected + 1)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 12h16m-6-6 6 6-6 6" />
            </svg>
          </button>
        </div>
      )}

      {canScroll && (
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          Ansicht {navigation.selected + 1} von {navigation.count}
        </span>
      )}
    </div>
  );
}
