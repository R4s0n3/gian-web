import Link from "next/link";

import { CategoryCarousel } from "@/app/_components/category-carousel";
import { HeroCarousel } from "@/app/_components/hero-carousel";
import { PublicSite } from "@/app/_components/public-site";
import { getPublicGallery, getPublicSiteSettings } from "@/app/_lib/content";
import type { GalleryCategory, GalleryItem } from "@/app/_lib/content-shared";

export const dynamic = "force-dynamic";

function categoryPreviews(gallery: GalleryItem[], category: GalleryCategory) {
  return gallery
    .filter((work) => work.category === category)
    .slice(0, 2)
    .map(({ id, slug, title, imageUrl, imageAlt, medium, year }) => ({
      id,
      slug,
      title,
      imageUrl,
      imageAlt,
      medium,
      year,
    }));
}

export default async function Home() {
  const [gallery, siteSettings] = await Promise.all([
    getPublicGallery(),
    getPublicSiteSettings(),
  ]);

  return (
    <PublicSite headerVariant="overlay">
      <main id="main-content">
        <section
          className="editorial-hero editorial-hero--carousel"
          aria-labelledby="hero-title"
        >
          <h1 className="sr-only" id="hero-title">
            Gian-Luca Blasius
          </h1>
          <HeroCarousel images={siteSettings.heroImages} />
        </section>

        <section
          className="editorial-statement section"
          id="editorial-statement"
        >
          <div className="site-shell editorial-statement__grid">
            <p className="eyebrow">Über die Arbeit</p>
            <blockquote>
              Bilder, die eher entdeckt als entworfen wirken — Spuren einer
              Schwelle zwischen Kontrolle und Instinkt.
            </blockquote>
            <div className="editorial-statement__copy">
              <p>
                Die Praxis von Gian-Luca Blasius bewegt sich zwischen
                zeitgenössischer Malerei und Fotografie. Architektur, Natur,
                Erinnerung und die Intelligenz der Hand bilden eine gemeinsame
                visuelle Sprache.
              </p>
              <p>
                Präzise, aber nie steril: Arbeiten, die Spannung, Textur und
                ihren Entstehungsprozess sichtbar bewahren.
              </p>
            </div>
          </div>
        </section>

        <section
          className="category-features section"
          aria-labelledby="portfolio-title"
        >
          <div className="site-shell">
            <div className="category-features__heading">
              <p className="eyebrow">Portfolio / Kategorien</p>
              <h2
                className="display category-features__title"
                id="portfolio-title"
              >
                Arbeiten im Überblick.
              </h2>
            </div>

            <div className="category-features__grid">
              <CategoryCarousel
                artworks={categoryPreviews(gallery, "PAINTING")}
                category="Gemälde"
                description="Originalarbeiten und malerische Studien aus dem Atelier."
                href="/gemaelde"
              />
              <CategoryCarousel
                artworks={categoryPreviews(gallery, "PHOTOGRAPHY")}
                category="Fotografien"
                description="Beobachtungen zwischen Landschaft, Struktur und Erinnerung."
                href="/fotografien"
              />
              <CategoryCarousel
                artworks={categoryPreviews(gallery, "COMMISSION")}
                category="Auftragsarbeiten"
                description="Kunst, die im Dialog mit einem Auftrag entstanden ist."
                href="/auftragsarbeiten"
              />
            </div>
          </div>
        </section>

        <section className="gallery-invitation section">
          <div className="site-shell">
            <div className="gallery-invitation__panel">
              <p className="eyebrow">Digitale Galerie</p>
              <h2 className="display">
                Das Portfolio wird zum begehbaren Raum.
              </h2>
              <div className="gallery-invitation__aside">
                <p>
                  Eine eigens für den Browser entwickelte Ausstellung. Nähere
                  dich den Arbeiten, erkunde die Räume und nimm dir Zeit.
                </p>
                <Link className="button" href="/doom">
                  Galerie öffnen <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="studio-paths section">
          <div className="site-shell studio-paths__grid">
            <Link className="studio-path" href="/shop">
              <span className="eyebrow">Editionen</span>
              <strong>Signierte Drucke und Objekte in kleinen Auflagen.</strong>
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="studio-path" href="/book">
              <span className="eyebrow">Projekte & Termine</span>
              <strong>
                Tattoo, Auftragsarbeit oder Zusammenarbeit anfragen.
              </strong>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    </PublicSite>
  );
}
