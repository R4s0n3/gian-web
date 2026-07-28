import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer__main">
        <div className="site-footer__brand">
          <p className="eyebrow">Unabhängiges Kunstatelier</p>
          <p className="display site-footer__name" aria-label="GIAN-LUCA">
            GIAN-LUCA
          </p>
        </div>

        <div className="site-footer__column">
          <h3>Entdecken</h3>
          <nav aria-label="Portfolio-Navigation im Footer">
            <Link href="/#work">Ausgewählte Arbeiten</Link>
            <Link href="/#studio">Studio</Link>
            <Link href="/shop">Editionen</Link>
            <Link href="/doom">Digitale Galerie</Link>
          </nav>
        </div>

        <div className="site-footer__column">
          <h3>Kontakt & Rechtliches</h3>
          <nav aria-label="Kontakt und Rechtliches im Footer">
            <Link href="/book">Tattoo-Anfrage</Link>
            <Link href="/book?service=artwork">Kunstwerk anfragen</Link>
            <Link href="/impressum">Impressum</Link>
            <Link href="/admin/login">Studio-Zugang</Link>
          </nav>
        </div>
      </div>

      <div className="site-shell site-footer__base">
        <span>© {new Date().getFullYear()} Kunstatelier GIAN-LUCA</span>
        <span>Originalarbeiten · Für&apos;s genaue Hinsehen</span>
      </div>
    </footer>
  );
}
