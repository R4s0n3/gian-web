import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/gemaelde", label: "Gemälde" },
  { href: "/fotografien", label: "Fotografien" },
  { href: "/auftragsarbeiten", label: "Auftragsarbeiten" },
  { href: "/doom", label: "Galerie" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
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

        <details className="mobile-menu">
          <summary>Menü</summary>
          <nav className="mobile-menu__panel" aria-label="Hauptnavigation">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
