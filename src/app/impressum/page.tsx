import type { Metadata } from "next";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { legalDetails, legalDetailsComplete } from "@/app/_lib/legal";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und Kontaktdaten von GIAN-LUCA Studio.",
};

export default function ImpressumPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero">
          <div className="site-shell page-hero__grid">
            <div>
              <p className="eyebrow">Rechtliche Informationen</p>
              <h1 className="display">Impressum</h1>
            </div>
            <div className="page-hero__aside">
              <p>
                Anbieterkennzeichnung und Kontakt für dieses digitale Angebot.
              </p>
            </div>
          </div>
        </section>

        <section className="legal-page section">
          <div className="site-shell legal-page__grid">
            {!legalDetailsComplete && (
              <aside className="legal-page__notice" role="note">
                <strong>Vor der Veröffentlichung ergänzen</strong>
                <p>
                  Die gesetzlich erforderlichen Angaben fehlen noch. Trage den
                  vollständigen Namen, die ladungsfähige Anschrift und die
                  Kontaktdaten in <code>src/app/_lib/legal.ts</code> ein.
                </p>
              </aside>
            )}

            <div className="legal-page__content">
              <section aria-labelledby="provider-heading">
                <p className="eyebrow">Anbieter</p>
                <h2 id="provider-heading">Angaben gemäß § 5 DDG</h2>
                <address>
                  <strong>{legalDetails.providerName}</strong>
                  <br />
                  handelnd unter Gian Studio
                  <br />
                  {legalDetails.streetAddress}
                  <br />
                  {legalDetails.postalCodeAndCity}
                </address>
              </section>

              <section aria-labelledby="contact-heading">
                <p className="eyebrow">Direkter Kontakt</p>
                <h2 id="contact-heading">Kontakt</h2>
                <dl>
                  <div>
                    <dt>E-Mail</dt>
                    <dd>{legalDetails.email}</dd>
                  </div>
                  <div>
                    <dt>Telefon</dt>
                    <dd>{legalDetails.phone}</dd>
                  </div>
                </dl>
              </section>

              {legalDetails.vatId && (
                <section aria-labelledby="vat-heading">
                  <p className="eyebrow">Steuerangaben</p>
                  <h2 id="vat-heading">Umsatzsteuer-ID</h2>
                  <p>
                    Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{" "}
                    {legalDetails.vatId}
                  </p>
                </section>
              )}

              {(legalDetails.registerName || legalDetails.registerNumber) && (
                <section aria-labelledby="register-heading">
                  <p className="eyebrow">Registereintrag</p>
                  <h2 id="register-heading">Register</h2>
                  <dl>
                    <div>
                      <dt>Register</dt>
                      <dd>{legalDetails.registerName}</dd>
                    </div>
                    <div>
                      <dt>Nummer</dt>
                      <dd>{legalDetails.registerNumber}</dd>
                    </div>
                  </dl>
                </section>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
