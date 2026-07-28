import type { Metadata } from "next";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { getPublicProducts } from "@/app/_lib/content";
import { ShopClient } from "@/app/shop/shop-client";

export const metadata: Metadata = {
  title: "Studio-Editionen",
  description:
    "Signierte Drucke, originale Studien und Studio-Objekte in kleinen Auflagen von GIAN-LUCA.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getPublicProducts();

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero">
          <div className="site-shell page-hero__grid">
            <div>
              <p className="eyebrow">
                Studio-Editionen / Limitierte Veröffentlichungen
              </p>
              <h1 className="display">Objekte mit Puls.</h1>
            </div>
            <div className="page-hero__aside">
              <p>
                Signierte Drucke, Einzelstudien und Objekte in kleinen Auflagen,
                nah am Original gefertigt. Neue Editionen erscheinen leise und
                in begrenzter Stückzahl.
              </p>
              <span className="eyebrow">
                Internationale Anfragen willkommen
              </span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="site-shell">
            {products.length ? (
              <ShopClient products={products} />
            ) : (
              <div className="public-empty">
                <p className="eyebrow">Das Editionsregal ist zurzeit leer.</p>
                <p>
                  Neue Studio-Objekte erscheinen hier mit ihrer
                  Veröffentlichung.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
