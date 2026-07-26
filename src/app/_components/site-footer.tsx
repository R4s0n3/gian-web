import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer__main">
        <div className="site-footer__brand">
          <p className="eyebrow">Independent practice</p>
          <p className="display site-footer__name" aria-label="Gian">
            Gian
          </p>
        </div>

        <div className="site-footer__column">
          <h3>Explore</h3>
          <nav aria-label="Footer portfolio navigation">
            <Link href="/#work">Selected work</Link>
            <Link href="/#studio">Studio</Link>
            <Link href="/shop">Editions</Link>
            <Link href="/doom">Digital gallery</Link>
          </nav>
        </div>

        <div className="site-footer__column">
          <h3>Make contact</h3>
          <nav aria-label="Footer contact navigation">
            <Link href="/book">Tattoo request</Link>
            <Link href="/book?service=artwork">Artwork enquiry</Link>
            <Link href="/admin/login">Studio access</Link>
          </nav>
        </div>
      </div>

      <div className="site-shell site-footer__base">
        <span>© {new Date().getFullYear()} Gian Studio</span>
        <span>Original work · Built for close looking</span>
      </div>
    </footer>
  );
}
