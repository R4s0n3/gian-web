/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { PublicSite } from "@/app/_components/public-site";
import { getPublicGallery, getPublicSiteSettings } from "@/app/_lib/content";
import type { GalleryCategory, GalleryItem } from "@/app/_lib/content-shared";

export const dynamic = "force-dynamic";

function featuredWork(
  gallery: GalleryItem[],
  category: GalleryCategory,
): GalleryItem | undefined {
  const categoryWorks = gallery.filter((item) => item.category === category);
  return categoryWorks.find((item) => item.featured) ?? categoryWorks[0];
}

function CategoryFeature({
  artwork,
  category,
  description,
  href,
  index,
  featured = false,
}: {
  artwork: GalleryItem | undefined;
  category: string;
  description: string;
  href: string;
  index: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`category-feature${featured ? "category-feature--featured" : ""}`}
    >
      <div className="category-feature__header">
        <p className="eyebrow">
          {index} / {category}
        </p>
        <p>{description}</p>
      </div>

      {artwork ? (
        <Link
          className="category-feature__work"
          href={`/work/${artwork.slug}`}
          aria-label={`${artwork.title} ansehen`}
        >
          <div className="category-feature__image">
            <img alt={artwork.imageAlt} loading="lazy" src={artwork.imageUrl} />
          </div>
          <div className="category-feature__meta">
            <div>
              <h3>{artwork.title}</h3>
              <p>
                {artwork.medium} · {artwork.year}
              </p>
            </div>
            <span aria-hidden="true">↗</span>
          </div>
        </Link>
      ) : (
        <div className="category-feature__empty">
          <p>Neue Arbeiten werden hier nach ihrer Veröffentlichung sichtbar.</p>
        </div>
      )}

      <Link className="text-link category-feature__link" href={href}>
        Alle {category} ansehen <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export default async function Home() {
  const [gallery, siteSettings] = await Promise.all([
    getPublicGallery(),
    getPublicSiteSettings(),
  ]);
  const featuredPainting = featuredWork(gallery, "PAINTING");
  const featuredPhotography = featuredWork(gallery, "PHOTOGRAPHY");
  const featuredCommission = featuredWork(gallery, "COMMISSION");
  const hasHero = Boolean(
    siteSettings.heroImageUrl && siteSettings.heroImageAlt,
  );

  return (
    <PublicSite>
      <main id="main-content">
        <section className="editorial-hero" aria-labelledby="hero-title">
          <div className="site-shell">
            <div className="editorial-hero__masthead">
              <h1 id="hero-title">Gian-Luca Blasius</h1>
              <p>zeitgenössische Kunst</p>
            </div>

            <div className="editorial-hero__frame">
              <div
                className={
                  hasHero
                    ? "editorial-hero__media"
                    : "editorial-hero__media editorial-hero__media--empty"
                }
              >
                {hasHero && (
                  <img
                    alt={siteSettings.heroImageAlt ?? ""}
                    className="editorial-hero__photo"
                    fetchPriority="high"
                    src={siteSettings.heroImageUrl ?? ""}
                  />
                )}
                <img
                  alt=""
                  aria-hidden="true"
                  className="editorial-hero__monogram"
                  height="184"
                  src="/logo.svg"
                  width="227"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="editorial-statement section">
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
            <div className="section-head">
              <p className="eyebrow">Portfolio / Kategorien</p>
              <h2 className="display section-head__title" id="portfolio-title">
                Arbeiten im Überblick.
              </h2>
            </div>

            <div className="category-features__split">
              <CategoryFeature
                artwork={featuredPainting}
                category="Gemälde"
                description="Originalarbeiten und malerische Studien aus dem aktuellen Atelierarchiv."
                href="/gemaelde"
                index="01"
                featured
              />
              <div className="category-features__stack">
                <CategoryFeature
                  artwork={featuredPhotography}
                  category="Fotografien"
                  description="Fotografische Beobachtungen zwischen Landschaft, Struktur und Erinnerung."
                  href="/fotografien"
                  index="02"
                />
                <CategoryFeature
                  artwork={featuredCommission}
                  category="Auftragsarbeiten"
                  description="Gemälde und fotografische Arbeiten, die im Dialog mit einem Auftrag entstanden sind."
                  href="/auftragsarbeiten"
                  index="03"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="gallery-invitation section">
          <div className="site-shell">
            <div className="gallery-invitation__panel">
              <p className="eyebrow">04 / Digitale Galerie</p>
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
