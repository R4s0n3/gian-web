"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { MobileMenu } from "@/app/_components/mobile-menu";

const navigation = [
  { href: "/gemaelde", label: "Gemälde" },
  { href: "/fotografien", label: "Fotografien" },
  { href: "/auftragsarbeiten", label: "Auftragsarbeiten" },
  { href: "/doom", label: "Galerie" },
];

export type SiteHeaderVariant = "default" | "overlay";

export function SiteHeader({
  variant = "default",
}: {
  variant?: SiteHeaderVariant;
}) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (variant !== "overlay") return;

    const header = headerRef.current;
    const hero = document.querySelector<HTMLElement>(
      ".editorial-hero--carousel",
    );
    if (!header || !hero) return;

    let frame = 0;
    const updateContrast = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const isPastHero =
          hero.getBoundingClientRect().bottom <=
          header.getBoundingClientRect().bottom;
        header.classList.toggle("site-header--past-hero", isPastHero);
      });
    };

    updateContrast();
    window.addEventListener("resize", updateContrast);
    window.addEventListener("scroll", updateContrast, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateContrast);
      window.removeEventListener("scroll", updateContrast);
      header.classList.remove("site-header--past-hero");
    };
  }, [variant]);

  return (
    <header
      ref={headerRef}
      className={
        variant === "overlay"
          ? "site-header site-header--overlay"
          : "site-header"
      }
    >
      <div className="site-shell site-header__inner">
        <Link
          className="site-logo"
          href="/"
          aria-label="Gian-Luca Blasius, Startseite"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="site-logo__image"
            height="184"
            src="/logo.svg"
            width="227"
          />
        </Link>

        <span className="site-header__name">Gian-Luca Blasius</span>

        <MobileMenu navigation={navigation} />
      </div>
    </header>
  );
}
