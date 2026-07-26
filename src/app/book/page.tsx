import type { Metadata } from "next";

import { BookingForm } from "@/app/book/booking-form";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Book a Project",
  description:
    "Request a tattoo consultation, artwork commission, or creative collaboration with Gian.",
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
              <p className="eyebrow">Tattoo / artwork / collaboration</p>
              <h1 className="display">Start with a conversation.</h1>
            </div>
            <div className="page-hero__aside">
              <p>
                Strong projects begin with a clear exchange. Share what you
                know, leave room for what you don’t, and the studio will shape a
                direction with you.
              </p>
              <span className="eyebrow">Every request reviewed personally</span>
            </div>
          </div>
        </section>

        <div className="site-shell booking-layout">
          <aside className="booking-intro">
            <p className="eyebrow">Before you send</p>
            <h2 className="display">Your idea does not need to be finished.</h2>
            <p>
              A mood, memory, placement, or material can be enough to begin. The
              studio will reply with availability, next steps, and any questions
              needed to build the work properly.
            </p>
            <hr className="rule" style={{ margin: "2rem 0" }} />
            <p className="form-note">
              Tattoo requests typically begin with a consultation. Dates shown
              are preferences and remain unconfirmed until you hear directly
              from the studio.
            </p>
          </aside>

          <BookingForm initialService={service} referencedWork={work} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
