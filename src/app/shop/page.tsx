import type { Metadata } from "next";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { getPublicProducts } from "@/app/_lib/content";
import { ShopClient } from "@/app/shop/shop-client";

export const metadata: Metadata = {
  title: "Studio Editions",
  description:
    "Signed prints, original studies, and small-run studio objects by Gian.",
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
              <p className="eyebrow">Studio editions / limited releases</p>
              <h1 className="display">Objects with a pulse.</h1>
            </div>
            <div className="page-hero__aside">
              <p>
                Signed prints, one-off studies, and small-run objects made close
                to the original work. New releases arrive quietly and in limited
                quantities.
              </p>
              <span className="eyebrow">Worldwide enquiries welcome</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="site-shell">
            {products.length ? (
              <ShopClient products={products} />
            ) : (
              <div className="public-empty">
                <p className="eyebrow">The edition shelf is currently empty.</p>
                <p>
                  New studio objects will appear here when they are released.
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
