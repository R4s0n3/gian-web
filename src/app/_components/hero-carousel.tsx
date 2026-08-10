"use client";

/* eslint-disable @next/next/no-img-element */
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { HeroImage } from "@/app/_lib/content-shared";

const AUTOPLAY_DELAY = 6_000;

function formatSlideNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function HeroCarousel({ images }: { images: HeroImage[] }) {
  const hasImages = images.length > 0;
  const hasMultipleSlides = images.length > 1;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const autoplayEnabledRef = useRef(true);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const interactingRef = useRef(false);
  const [autoplay] = useState(() =>
    Autoplay({
      delay: AUTOPLAY_DELAY,
      playOnInit: false,
      stopOnFocusIn: false,
      stopOnInteraction: true,
      stopOnMouseEnter: false,
    }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: hasMultipleSlides },
    [autoplay],
  );

  const syncAutoplay = useCallback(() => {
    const shouldPause =
      !autoplayEnabledRef.current ||
      hoveredRef.current ||
      focusedRef.current ||
      interactingRef.current;

    if (shouldPause) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
  }, [autoplay]);

  const selectSlide = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  const selectPrevious = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const selectNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const toggleAutoplay = useCallback(() => {
    const nextEnabled = !autoplayEnabledRef.current;
    autoplayEnabledRef.current = nextEnabled;
    setAutoplayEnabled(nextEnabled);

    if (nextEnabled) {
      syncAutoplay();
    } else {
      autoplay.stop();
    }
  }, [autoplay, syncAutoplay]);

  const pauseForHover = useCallback(() => {
    hoveredRef.current = true;
    syncAutoplay();
  }, [syncAutoplay]);

  const resumeAfterHover = useCallback(() => {
    hoveredRef.current = false;
    syncAutoplay();
  }, [syncAutoplay]);

  const pauseForFocus = useCallback(() => {
    focusedRef.current = true;
    syncAutoplay();
  }, [syncAutoplay]);

  const resumeAfterFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return;
      }

      focusedRef.current = false;
      syncAutoplay();
    },
    [syncAutoplay],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const updateSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    const pauseForInteraction = () => {
      interactingRef.current = true;
      syncAutoplay();
    };
    const resumeAfterInteraction = () => {
      interactingRef.current = false;
      syncAutoplay();
    };

    updateSelectedIndex();
    emblaApi.on("select", updateSelectedIndex);
    emblaApi.on("reInit", updateSelectedIndex);
    emblaApi.on("pointerDown", pauseForInteraction);
    emblaApi.on("pointerUp", resumeAfterInteraction);

    return () => {
      emblaApi.off("select", updateSelectedIndex);
      emblaApi.off("reInit", updateSelectedIndex);
      emblaApi.off("pointerDown", pauseForInteraction);
      emblaApi.off("pointerUp", resumeAfterInteraction);
    };
  }, [emblaApi, syncAutoplay]);

  useEffect(() => {
    if (!emblaApi || !hasMultipleSlides) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      const enabled = !reducedMotion.matches;
      autoplayEnabledRef.current = enabled;
      setAutoplayEnabled(enabled);
      syncAutoplay();
    };

    applyMotionPreference();
    reducedMotion.addEventListener("change", applyMotionPreference);

    return () => {
      reducedMotion.removeEventListener("change", applyMotionPreference);
      autoplay.stop();
    };
  }, [autoplay, emblaApi, hasMultipleSlides, syncAutoplay]);

  const rootClassName = [
    "hero-carousel",
    !hasImages && "hero-carousel--empty",
    hasImages && !hasMultipleSlides && "hero-carousel--single",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-label="Ausgewählte Arbeiten"
      aria-roledescription="Karussell"
      className={rootClassName}
      onBlurCapture={resumeAfterFocus}
      onFocusCapture={pauseForFocus}
      onMouseEnter={pauseForHover}
      onMouseLeave={resumeAfterHover}
      role="region"
    >
      {hasImages ? (
        <div className="hero-carousel__viewport" ref={emblaRef}>
          <div className="hero-carousel__container">
            {images.map((image, index) => (
              <div
                aria-hidden={selectedIndex !== index}
                aria-label={`${index + 1} von ${images.length}`}
                aria-roledescription="Folie"
                className="hero-carousel__slide"
                key={`${image.url}-${index}`}
                role="group"
              >
                <img
                  alt={image.alt}
                  className="hero-carousel__image"
                  decoding="async"
                  draggable={false}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  src={image.url}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="hero-carousel__empty" role="status">
          <span className="sr-only">
            Noch keine Bilder für den Startseiten-Slider hinterlegt.
          </span>
        </div>
      )}

      <img
        alt=""
        aria-hidden="true"
        className="hero-carousel__monogram"
        height="184"
        src="/logo.svg"
        width="227"
      />

      {hasMultipleSlides && (
        <div
          aria-label="Karussell-Steuerung"
          className="hero-carousel__controls"
          role="group"
        >
          <div className="hero-carousel__arrows">
            <button
              aria-label="Vorheriges Bild"
              className="hero-carousel__button hero-carousel__button--previous"
              onClick={selectPrevious}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="hero-carousel__icon"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path d="m12.5 4.5-5 5.5 5 5.5M8 10h8" stroke="currentColor" />
              </svg>
            </button>
            <button
              aria-label="Nächstes Bild"
              className="hero-carousel__button hero-carousel__button--next"
              onClick={selectNext}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="hero-carousel__icon"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path d="m7.5 4.5 5 5.5-5 5.5M12 10H4" stroke="currentColor" />
              </svg>
            </button>
          </div>

          <div className="hero-carousel__pagination">
            <div className="hero-carousel__dots">
              {images.map((image, index) => {
                const isSelected = selectedIndex === index;

                return (
                  <button
                    aria-current={isSelected ? "true" : undefined}
                    aria-label={`Bild ${index + 1} anzeigen: ${image.alt}`}
                    className={
                      isSelected
                        ? "hero-carousel__dot is-selected"
                        : "hero-carousel__dot"
                    }
                    key={`${image.url}-${index}`}
                    onClick={() => selectSlide(index)}
                    type="button"
                  />
                );
              })}
            </div>
            <span aria-hidden="true" className="hero-carousel__count">
              {formatSlideNumber(selectedIndex + 1)} /{" "}
              {formatSlideNumber(images.length)}
            </span>
            <span aria-atomic="true" aria-live="polite" className="sr-only">
              Bild {selectedIndex + 1} von {images.length}:{" "}
              {images[selectedIndex]?.alt}
            </span>
          </div>

          <button
            aria-label={
              autoplayEnabled
                ? "Automatische Wiedergabe pausieren"
                : "Automatische Wiedergabe starten"
            }
            aria-pressed={!autoplayEnabled}
            className="hero-carousel__autoplay"
            onClick={toggleAutoplay}
            type="button"
          >
            {autoplayEnabled ? (
              <svg
                aria-hidden="true"
                className="hero-carousel__icon"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path d="M7 5v10M13 5v10" stroke="currentColor" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="hero-carousel__icon"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="m7 4 8 6-8 6V4Z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
