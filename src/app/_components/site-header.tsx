import Link from "next/link";

const navigation = [
  { href: "/#work", label: "Arbeiten" },
  { href: "/#studio", label: "Studio" },
  { href: "/shop", label: "Editionen" },
  { href: "/book", label: "Tattoo" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`site-header${overlay ? "site-header--overlay" : ""}`}>
      <div className="site-shell site-header__inner">
        <Link className="site-logo" href="/" aria-label="Gian, Startseite">
          <span className="site-logo__mark">Gian</span>
          <span className="site-logo__descriptor">
            Zeitgenössische Kunst & Tattoo
          </span>
        </Link>

        <nav className="site-nav" aria-label="Hauptnavigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="button button--small site-header__action" href="/doom">
          Galerie betreten <span aria-hidden="true">↗</span>
        </Link>

        <details className="mobile-menu">
          <summary>Menü</summary>
          <nav className="mobile-menu__panel" aria-label="Mobile Navigation">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/doom">Galerie betreten ↗</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
