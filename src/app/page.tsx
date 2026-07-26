/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { ArtworkCard } from "@/app/_components/artwork-card";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { getPublicGallery, getPublicProducts } from "@/app/_lib/content";
import { formatMoney } from "@/app/_lib/content-shared";

export const dynamic = "force-dynamic";

const tickerItems = [
  "Contemporary art",
  "Tattoo projects",
  "Limited editions",
  "Private commissions",
  "Digital exhibition",
];

export default async function Home() {
  const [gallery, products] = await Promise.all([
    getPublicGallery(),
    getPublicProducts(),
  ]);
  const heroArtwork = gallery.find((item) => item.featured) ?? gallery[0];
  const featuredGallery = gallery.slice(0, 6);
  const featuredProducts = products.slice(0, 3);

  return (
    <>
      <SiteHeader overlay />
      <main id="main-content">
        <section className="home-hero" aria-labelledby="hero-title">
          <div
            className={`site-shell home-hero__grid${heroArtwork ? "" : "home-hero__grid--empty"}`}
          >
            <div className="home-hero__copy">
              <p className="eyebrow">Gian / contemporary art & tattoo</p>
              <h1 className="display home-hero__title" id="hero-title">
                Marks for
                <span className="indent outline">temporary</span>
                <span>
                  <em>bodies.</em>
                </span>
              </h1>

              <div className="home-hero__footer">
                <p className="home-hero__lede">
                  Original work across canvas, skin, objects, and digital
                  space—built from ritual, interference, and the beauty of a
                  deliberate mark.
                </p>
                <div className="home-hero__actions">
                  <Link className="button button--ember" href="#work">
                    View selected work
                  </Link>
                  <Link className="button" href="/doom">
                    Enter exhibition <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </div>

            {heroArtwork && (
              <Link
                className="hero-art"
                href={`/work/${heroArtwork.slug}`}
                aria-label={`View ${heroArtwork.title}`}
              >
                <div className="hero-art__frame">
                  <img
                    alt={heroArtwork.imageAlt}
                    fetchPriority="high"
                    src={heroArtwork.imageUrl}
                  />
                </div>
                <span className="hero-art__tag">
                  Selected work
                  <br />
                  {heroArtwork.year}
                  <br />
                  View piece →
                </span>
                <span className="hero-art__index" aria-hidden="true">
                  01
                </span>
              </Link>
            )}
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span className="ticker__item" key={`${item}-${index}`}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <section className="section" id="work" aria-labelledby="work-title">
          <div className="site-shell">
            <div className="section-head">
              <p className="eyebrow">01 / Selected work</p>
              <div>
                <h2 className="display section-head__title" id="work-title">
                  Built to resist a quick look.
                </h2>
                <div className="section-head__aside">
                  <p>
                    A living selection from the studio. Each work begins with a
                    system, then makes room for accident, abrasion, and the
                    intelligence of the hand.
                  </p>
                  <Link className="text-link" href="/doom">
                    See the work in another dimension ↗
                  </Link>
                </div>
              </div>
            </div>

            {featuredGallery.length ? (
              <div className="artwork-grid">
                {featuredGallery.map((artwork, index) => (
                  <ArtworkCard
                    artwork={artwork}
                    index={index}
                    key={artwork.id}
                  />
                ))}
              </div>
            ) : (
              <div className="public-empty">
                <p className="eyebrow">The archive is between exhibitions.</p>
                <p>New published work will appear here soon.</p>
              </div>
            )}
          </div>
        </section>

        <section className="statement section" id="studio">
          <div className="site-shell statement__grid">
            <blockquote className="statement__quote">
              “I make images that feel discovered rather than designed—
              <mark> evidence of a threshold</mark> between control and
              instinct.”
            </blockquote>

            <div className="statement__copy">
              <p className="eyebrow">02 / Studio statement</p>
              <p>
                Gian’s practice moves between contemporary image-making and
                tattooing. Architecture, ritual objects, signal noise, and
                bodily memory form a shared visual language across both.
              </p>
              <p>
                The result is precise but never sterile: work that holds
                tension, texture, and a trace of the process that made it.
              </p>
              <Link className="text-link" href="/book?service=artwork">
                Start a commission →
              </Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="process-title">
          <div className="site-shell">
            <p className="eyebrow">03 / The approach</p>
            <h2
              className="display section-head__title"
              id="process-title"
              style={{ marginTop: "1.5rem" }}
            >
              One visual language. Different surfaces.
            </h2>

            <div className="process-grid">
              <article className="process-card">
                <span className="process-card__number">01</span>
                <h3 className="display">Listen closely</h3>
                <p>
                  Every commission begins with context: your references, the
                  space or body, and what the finished work should carry.
                </p>
              </article>
              <article className="process-card">
                <span className="process-card__number">02</span>
                <h3 className="display">Build a system</h3>
                <p>
                  Composition, rhythm, and material create the rules. Sketches
                  become a distinct direction—not a copy of something already
                  seen.
                </p>
              </article>
              <article className="process-card">
                <span className="process-card__number">03</span>
                <h3 className="display">Leave a trace</h3>
                <p>
                  The final work preserves evidence of touch: pressure, texture,
                  variation, and the productive risk of making it by hand.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="experience" aria-labelledby="experience-title">
          <div className="site-shell experience__grid">
            <h2 className="display experience__title" id="experience-title">
              Don’t scroll. <em>Step inside.</em>
            </h2>
            <div className="experience__aside">
              <p>
                Walk through an original browser-built exhibition where the
                portfolio becomes architecture. Explore the rooms, approach the
                work, and look at your own pace.
              </p>
              <Link className="button" href="/doom">
                Launch the art gallery <span aria-hidden="true">↗</span>
              </Link>
              <p className="experience__note">
                <span aria-hidden="true">◎</span>
                <span>
                  Use a keyboard and mouse on desktop, or the on-screen touch
                  controls on mobile. Sound is optional.
                </span>
              </p>
            </div>
          </div>
        </section>

        <section
          className="section shop-preview"
          aria-labelledby="editions-title"
        >
          <div className="site-shell">
            <div className="section-head">
              <p className="eyebrow">04 / Studio editions</p>
              <div>
                <h2 className="display section-head__title" id="editions-title">
                  Art that can leave the studio.
                </h2>
                <div className="section-head__aside">
                  <p>
                    Signed prints, studies, and small-run objects. Produced
                    carefully, released infrequently.
                  </p>
                  <Link className="text-link" href="/shop">
                    Visit the shop →
                  </Link>
                </div>
              </div>
            </div>

            {featuredProducts.length ? (
              <div className="product-grid">
                {featuredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <Link href="/shop" aria-label={`Shop ${product.name}`}>
                      <div className="product-card__image">
                        <img
                          alt={`${product.name}, a studio edition by Gian`}
                          loading="lazy"
                          src={product.imageUrl}
                        />
                      </div>
                    </Link>
                    <div className="product-card__body">
                      <h3 className="product-card__title">{product.name}</h3>
                      <span className="product-card__price">
                        {formatMoney(product.priceCents, product.currency)}
                      </span>
                      <p className="product-card__description">
                        {product.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="public-empty">
                <p className="eyebrow">No editions are currently available.</p>
                <p>Return for the studio’s next small release.</p>
              </div>
            )}
          </div>
        </section>

        <section className="booking-banner" aria-labelledby="booking-title">
          <div className="site-shell booking-banner__inner">
            <div>
              <p className="eyebrow" style={{ color: "var(--ink)" }}>
                Tattoo & private commissions
              </p>
              <h2 className="display" id="booking-title">
                Bring an idea. Leave with a mark.
              </h2>
            </div>
            <Link className="button" href="/book">
              Request an appointment →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
