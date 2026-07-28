/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { ArtworkCard } from "@/app/_components/artwork-card";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { getPublicGallery, getPublicProducts } from "@/app/_lib/content";
import { formatMoney } from "@/app/_lib/content-shared";

export const dynamic = "force-dynamic";

const tickerItems = [
  "Fine Art",
  "Tattoo-Projekte",
  "Limitierte Editionen",
  "Private Auftragsarbeiten",
  "Digitale Ausstellung",
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
            className={
              heroArtwork
                ? "site-shell home-hero__grid"
                : "site-shell home-hero__grid home-hero__grid--empty"
            }
          >
            <div className="home-hero__copy">
              <p className="eyebrow">Fine Art</p>
              <h1 className="home-hero__brand" id="hero-title">
                <span className="sr-only">GIAN-LUCA — Fine Art</span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="home-hero__brand-mark"
                  height="184"
                  src="/logo.svg"
                  width="227"
                />
              </h1>
              <p className="home-hero__artist-name" aria-hidden="true">
                GIAN-LUCA
              </p>

              <div className="home-hero__footer">
                <p className="home-hero__lede">
                  Originalarbeiten auf Leinwand, Haut, Objekten und im digitalen
                  Raum – geprägt von Ritual, Störung und der Schönheit einer
                  bewussten Spur.
                </p>
                <div className="home-hero__actions">
                  <Link className="button button--ember" href="#work">
                    Arbeiten ansehen
                  </Link>
                  <Link className="button" href="/doom">
                    Ausstellung betreten <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </div>

            {heroArtwork && (
              <Link
                className="hero-art"
                href={`/work/${heroArtwork.slug}`}
                aria-label={`${heroArtwork.title} ansehen`}
              >
                <div className="hero-art__frame">
                  <img
                    alt={heroArtwork.imageAlt}
                    fetchPriority="high"
                    src={heroArtwork.imageUrl}
                  />
                </div>
                <span className="hero-art__tag">
                  Ausgewählte Arbeit
                  <br />
                  {heroArtwork.year}
                  <br />
                  Werk ansehen →
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
              <p className="eyebrow">01 / Ausgewählte Arbeiten</p>
              <div>
                <h2 className="display section-head__title" id="work-title">
                  Gemacht für den zweiten Blick.
                </h2>
                <div className="section-head__aside">
                  <p>
                    Eine lebendige Auswahl aus dem Studio. Jedes Werk beginnt
                    mit einem System und öffnet dann Raum für Zufall, Abrieb und
                    die Intelligenz der Hand.
                  </p>
                  <Link className="text-link" href="/doom">
                    Arbeiten in einer anderen Dimension erleben ↗
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
                <p className="eyebrow">
                  Das Archiv befindet sich zwischen zwei Ausstellungen.
                </p>
                <p>Neue veröffentlichte Arbeiten erscheinen bald hier.</p>
              </div>
            )}
          </div>
        </section>

        <section className="statement section" id="studio">
          <div className="site-shell statement__grid">
            <blockquote className="statement__quote">
              „Ich erschaffe Bilder, die eher entdeckt als entworfen wirken –
              <mark> Spuren einer Schwelle</mark> zwischen Kontrolle und
              Instinkt.“
            </blockquote>

            <div className="statement__copy">
              <p className="eyebrow">02 / Über das Studio</p>
              <p>
                Die Praxis von GIAN-LUCA bewegt sich zwischen zeitgenössischer
                Bildkunst und Tattoo. Architektur, rituelle Objekte,
                Signalrauschen und körperliche Erinnerung bilden eine gemeinsame
                visuelle Sprache.
              </p>
              <p>
                Das Ergebnis ist präzise, aber nie steril: Arbeiten, die
                Spannung, Textur und eine Spur ihres Entstehungsprozesses
                bewahren.
              </p>
              <Link className="text-link" href="/book?service=artwork">
                Auftragsarbeit anfragen →
              </Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="process-title">
          <div className="site-shell">
            <p className="eyebrow">03 / Der Prozess</p>
            <h2
              className="display section-head__title"
              id="process-title"
              style={{ marginTop: "1.5rem" }}
            >
              Eine visuelle Sprache. Verschiedene Oberflächen.
            </h2>

            <div className="process-grid">
              <article className="process-card">
                <span className="process-card__number">01</span>
                <h3 className="display">Genau zuhören</h3>
                <p>
                  Jede Auftragsarbeit beginnt mit dem Kontext: deinen
                  Referenzen, dem Raum oder Körper und dem, was das fertige Werk
                  tragen soll.
                </p>
              </article>
              <article className="process-card">
                <span className="process-card__number">02</span>
                <h3 className="display">Ein System entwickeln</h3>
                <p>
                  Komposition, Rhythmus und Material schaffen die Regeln. Aus
                  Skizzen entsteht eine eigenständige Richtung – keine Kopie von
                  etwas bereits Gesehenem.
                </p>
              </article>
              <article className="process-card">
                <span className="process-card__number">03</span>
                <h3 className="display">Spuren hinterlassen</h3>
                <p>
                  Das fertige Werk bewahrt Spuren der Berührung: Druck, Textur,
                  Variation und das produktive Risiko der Handarbeit.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="experience" aria-labelledby="experience-title">
          <div className="site-shell experience__grid">
            <h2 className="display experience__title" id="experience-title">
              Nicht scrollen. <em>Eintreten.</em>
            </h2>
            <div className="experience__aside">
              <p>
                Geh durch eine eigens für den Browser entwickelte Ausstellung,
                in der das Portfolio zur Architektur wird. Erkunde die Räume,
                nähere dich den Arbeiten und nimm dir Zeit.
              </p>
              <Link className="button" href="/doom">
                Kunstgalerie starten <span aria-hidden="true">↗</span>
              </Link>
              <p className="experience__note">
                <span aria-hidden="true">◎</span>
                <span>
                  Am Desktop mit Tastatur und Maus, mobil mit der
                  Touch-Steuerung. Ton ist optional.
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
              <p className="eyebrow">04 / Studio-Editionen</p>
              <div>
                <h2 className="display section-head__title" id="editions-title">
                  Kunst, die das Studio verlassen kann.
                </h2>
                <div className="section-head__aside">
                  <p>
                    Signierte Drucke, Studien und Objekte in kleinen Auflagen.
                    Sorgfältig gefertigt und selten veröffentlicht.
                  </p>
                  <Link className="text-link" href="/shop">
                    Zum Shop →
                  </Link>
                </div>
              </div>
            </div>

            {featuredProducts.length ? (
              <div className="product-grid">
                {featuredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <Link
                      href="/shop"
                      aria-label={`${product.name} im Shop ansehen`}
                    >
                      <div className="product-card__image">
                        <img
                          alt={`${product.name}, eine Studio-Edition von GIAN-LUCA`}
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
                <p className="eyebrow">
                  Zurzeit sind keine Editionen verfügbar.
                </p>
                <p>
                  Schau zur nächsten kleinen Veröffentlichung wieder vorbei.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="booking-banner" aria-labelledby="booking-title">
          <div className="site-shell booking-banner__inner">
            <div>
              <p className="eyebrow" style={{ color: "var(--ink)" }}>
                Tattoo & private Auftragsarbeiten
              </p>
              <h2 className="display" id="booking-title">
                Bring eine Idee. Geh mit einer Spur.
              </h2>
            </div>
            <Link className="button" href="/book">
              Termin anfragen →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
