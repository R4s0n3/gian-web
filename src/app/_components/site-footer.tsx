import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer__main">
        <div className="site-footer__brand">
          <p className="eyebrow">Gian-Luca Blasius</p>
          <p
            className="display site-footer__name"
            aria-label="Zeitgenössische Kunst"
          >
            Zeitgenössische Kunst
          </p>
        </div>

        <div className="site-footer__column">
          <h3>Portfolio</h3>
          <nav aria-label="Portfolio-Navigation im Footer">
            <Link href="/gemaelde">Gemälde</Link>
            <Link href="/fotografien">Fotografien</Link>
            <Link href="/auftragsarbeiten">Auftragsarbeiten</Link>
            <Link href="/doom">Galerie</Link>
          </nav>
        </div>

        <div className="site-footer__column">
          <h3>Studio</h3>
          <nav aria-label="Studio und Rechtliches im Footer">
            <Link href="/shop">Editionen</Link>
            <Link href="/book">Projekt anfragen</Link>
            <Link href="/book?service=artwork">Kunstwerk anfragen</Link>
            <Link href="/impressum">Impressum</Link>
          </nav>
        </div>
      </div>

      <div className="site-shell site-footer__base">
        <span>© {new Date().getFullYear()} Gian-Luca Blasius</span>
        <span>Gemälde · Fotografien · Auftragsarbeiten</span>
      </div>
    </footer>
  );
}
