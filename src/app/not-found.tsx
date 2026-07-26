import Link from "next/link";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="success-page" id="main-content">
        <div className="site-shell success-page__inner">
          <p className="eyebrow">404 / Seite nicht gefunden</p>
          <h1 className="display">
            Diese Spur endet <em>hier.</em>
          </h1>
          <p>
            Die gesuchte Seite existiert nicht oder wurde an einen anderen Ort
            verschoben.
          </p>
          <Link className="button button--ember" href="/">
            Zurück zum Portfolio
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
