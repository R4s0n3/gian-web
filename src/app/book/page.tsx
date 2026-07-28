import type { Metadata } from "next";

import { BookingForm } from "@/app/book/booking-form";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Projekt anfragen",
  description:
    "Tattoo-Beratung, Auftragsarbeit oder kreative Zusammenarbeit mit GIAN-LUCA anfragen.",
};

type BookPageProps = {
  searchParams: Promise<{ service?: string; work?: string }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const { service, work } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero">
          <div className="site-shell page-hero__grid">
            <div>
              <p className="eyebrow">Tattoo / Kunst / Zusammenarbeit</p>
              <h1 className="display">Am Anfang steht ein Gespräch.</h1>
            </div>
            <div className="page-hero__aside">
              <p>
                Starke Projekte beginnen mit einem klaren Austausch. Teile, was
                du schon weißt, lass Raum für das Unbekannte und entwickle
                gemeinsam mit dem Studio eine Richtung.
              </p>
              <span className="eyebrow">
                Jede Anfrage wird persönlich gelesen
              </span>
            </div>
          </div>
        </section>

        <div className="site-shell booking-layout">
          <aside className="booking-intro">
            <p className="eyebrow">Vor dem Absenden</p>
            <h2 className="display">Deine Idee muss noch nicht fertig sein.</h2>
            <p>
              Eine Stimmung, Erinnerung, Platzierung oder ein Material kann als
              Anfang genügen. Das Studio antwortet mit Verfügbarkeiten, den
              nächsten Schritten und allen Fragen, die für die Arbeit wichtig
              sind.
            </p>
            <hr className="rule" style={{ margin: "2rem 0" }} />
            <p className="form-note">
              Tattoo-Anfragen beginnen in der Regel mit einer Beratung.
              Angegebene Termine sind Wünsche und erst bestätigt, wenn du eine
              persönliche Rückmeldung vom Studio erhältst.
            </p>
          </aside>

          <BookingForm initialService={service} referencedWork={work} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
