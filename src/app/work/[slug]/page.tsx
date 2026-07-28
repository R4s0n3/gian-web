/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkCard } from "@/app/_components/artwork-card";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { getPublicGallery } from "@/app/_lib/content";

export const dynamic = "force-dynamic";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getPublicGallery();
  const artwork = gallery.find((item) => item.slug === slug);

  if (!artwork) {
    return { title: "Arbeit nicht gefunden" };
  }

  return {
    title: artwork.title,
    description: artwork.excerpt,
    openGraph: {
      title: `${artwork.title} — GIAN-LUCA`,
      description: artwork.excerpt,
      images: [{ url: artwork.imageUrl, alt: artwork.imageAlt }],
    },
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const gallery = await getPublicGallery();
  const artworkIndex = gallery.findIndex((item) => item.slug === slug);
  const artwork = gallery[artworkIndex];

  if (!artwork) {
    notFound();
  }

  const related = gallery.filter((item) => item.id !== artwork.id).slice(0, 2);
  const nextArtwork = gallery[(artworkIndex + 1) % gallery.length];

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <article className="work-detail">
          <div className="site-shell">
            <div className="work-detail__topline">
              <Link className="text-link" href="/#work">
                ← Ausgewählte Arbeiten
              </Link>
              {nextArtwork && (
                <Link className="text-link" href={`/work/${nextArtwork.slug}`}>
                  Nächste Arbeit →
                </Link>
              )}
            </div>

            <div className="work-detail__visual">
              <img alt={artwork.imageAlt} src={artwork.imageUrl} />
            </div>

            <div className="work-detail__info">
              <div>
                <p className="eyebrow">
                  Arbeit {String(artworkIndex + 1).padStart(2, "0")}
                </p>
                <h1 className="display work-detail__title">{artwork.title}</h1>
                <p className="work-detail__description">
                  {artwork.description}
                </p>
              </div>

              <div>
                <dl className="meta-list">
                  <div>
                    <dt>Jahr</dt>
                    <dd>{artwork.year}</dd>
                  </div>
                  <div>
                    <dt>Material</dt>
                    <dd>{artwork.medium}</dd>
                  </div>
                  <div>
                    <dt>Maße</dt>
                    <dd>{artwork.dimensions}</dd>
                  </div>
                  <div>
                    <dt>Edition</dt>
                    <dd>Originalarbeit</dd>
                  </div>
                </dl>

                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    marginTop: "2rem",
                  }}
                >
                  <Link
                    className="button button--ember"
                    href={`/book?service=artwork&work=${encodeURIComponent(artwork.title)}`}
                  >
                    Diese Arbeit anfragen
                  </Link>
                  <Link className="button" href="/doom">
                    In der digitalen Galerie ansehen ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section
            className="section shop-preview"
            aria-labelledby="related-title"
          >
            <div className="site-shell">
              <div className="section-head">
                <p className="eyebrow">Weitersehen</p>
                <h2 className="display section-head__title" id="related-title">
                  Aus demselben Studio.
                </h2>
              </div>
              <div className="artwork-grid">
                {related.map((item, index) => (
                  <ArtworkCard artwork={item} index={index} key={item.id} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
