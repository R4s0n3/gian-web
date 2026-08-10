import Image from "next/image";
import Link from "next/link";

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
  return (
    <header
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
