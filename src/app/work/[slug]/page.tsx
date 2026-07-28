/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkCard } from "@/app/_components/artwork-card";
import { PublicSite } from "@/app/_components/public-site";
import { getPublicGallery } from "@/app/_lib/content";
import { galleryCategoryPresentation } from "@/app/_lib/gallery-categories";
import { getSocialLinks } from "@/app/_lib/social-links";
import { env } from "@/env";

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
      title: `${artwork.title} — Gian-Luca Blasius`,
      description: artwork.excerpt,
      images: [
        { url: artwork.imageUrl, alt: artwork.imageAlt },
        ...artwork.images.map((image) => ({
          url: image.url,
          alt: image.alt,
        })),
      ],
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

  const category = galleryCategoryPresentation[artwork.category];
  const categoryGallery = gallery.filter(
    (item) => item.category === artwork.category,
  );
  const categoryArtworkIndex = categoryGallery.findIndex(
    (item) => item.id === artwork.id,
  );
  const related = categoryGallery
    .filter((item) => item.id !== artwork.id)
    .slice(0, 2);
  const nextArtwork =
    categoryGallery.length > 1
      ? categoryGallery[(categoryArtworkIndex + 1) % categoryGallery.length]
      : undefined;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const artworkUrl = new URL(`/work/${artwork.slug}`, siteUrl).toString();
  const artworkImageUrl = new URL(artwork.imageUrl, siteUrl).toString();
  const socialLinks = getSocialLinks({
    title: artwork.title,
    url: artworkUrl,
    imageUrl: artworkImageUrl,
  });
  const artworkImages = [
    { url: artwork.imageUrl, alt: artwork.imageAlt },
    ...artwork.images,
  ];

  return (
    <PublicSite>
      <main id="main-content">
        <article className="work-detail">
          <div className="site-shell">
            <div className="work-detail__topline">
              <Link className="text-link" href={category.archiveHref}>
                ← Alle {category.plural}
              </Link>
              {nextArtwork && (
                <Link className="text-link" href={`/work/${nextArtwork.slug}`}>
                  {category.nextLabel} →
                </Link>
              )}
            </div>

            <div className="work-detail__visuals">
              {artworkImages.map((image, index) => (
                <figure
                  className="work-detail__visual"
                  key={`${image.url}-${index}`}
                >
                  <img alt={image.alt} src={image.url} />
                </figure>
              ))}
            </div>

            <div className="work-detail__info">
              <div>
                <p className="eyebrow">
                  {category.singular}{" "}
                  {String(categoryArtworkIndex + 1).padStart(2, "0")}
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
                    <dt>Kategorie</dt>
                    <dd>{category.singular}</dd>
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
                <div className="work-detail__social">
                  <p className="eyebrow">Arbeit teilen</p>
                  <div className="work-detail__social-links">
                    {socialLinks.map((socialLink) => (
                      <a
                        className="button"
                        href={socialLink.href}
                        key={socialLink.label}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {socialLink.label} ↗
                      </a>
                    ))}
                  </div>
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
                <p className="eyebrow">Weitersehen / {category.plural}</p>
                <h2 className="display section-head__title" id="related-title">
                  Weitere {category.plural}.
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
    </PublicSite>
  );
}
