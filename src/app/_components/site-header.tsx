import Link from "next/link";

const navigation = [
  { href: "/#work", label: "Work" },
  { href: "/#studio", label: "Studio" },
  { href: "/shop", label: "Editions" },
  { href: "/book", label: "Tattoo" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`site-header${overlay ? "site-header--overlay" : ""}`}>
      <div className="site-shell site-header__inner">
        <Link className="site-logo" href="/" aria-label="Gian, home">
          <span className="site-logo__mark">Gian</span>
          <span className="site-logo__descriptor">
            Contemporary art & tattoo
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="button button--small site-header__action" href="/doom">
          Enter the gallery <span aria-hidden="true">↗</span>
        </Link>

        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav className="mobile-menu__panel" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/doom">Enter the gallery ↗</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
