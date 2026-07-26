import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Bestellung erhalten",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type CheckoutSuccessProps = {
  searchParams: Promise<{ session_id?: string }>;
};

type ConfirmationState =
  "paid" | "processing" | "cancelled" | "refunded" | "invalid" | "unavailable";

async function confirmationState(
  sessionId: string | undefined,
): Promise<ConfirmationState> {
  if (!sessionId || sessionId.length > 255) return "invalid";

  try {
    const order = await db.order.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      select: { status: true },
    });

    if (!order) return "invalid";
    if (["PAID", "PROCESSING", "FULFILLED"].includes(order.status)) {
      return "paid";
    }
    if (order.status === "PENDING") return "processing";
    if (order.status === "REFUNDED") return "refunded";
    return "cancelled";
  } catch {
    return "unavailable";
  }
}

const content: Record<
  ConfirmationState,
  { eyebrow: string; title: React.ReactNode; description: string }
> = {
  paid: {
    eyebrow: "Zahlung erhalten",
    title: (
      <>
        Die Arbeit gehört <em>dir.</em>
      </>
    ),
    description:
      "Danke, dass du ein unabhängiges Studio unterstützt. Dein Beleg ist unterwegs. Das Studio meldet sich erneut, sobald die Edition versandbereit ist.",
  },
  processing: {
    eyebrow: "Zahlung wird verarbeitet",
    title: (
      <>
        Wir bestätigen <em>das Signal.</em>
      </>
    ),
    description:
      "Stripe hat dich zum Studio zurückgeführt, während die Zahlungsbestätigung noch eintrifft. Deine Bestellung bleibt reserviert; der Beleg folgt per E-Mail.",
  },
  cancelled: {
    eyebrow: "Checkout nicht abgeschlossen",
    title: (
      <>
        Es wurde nichts <em>berechnet.</em>
      </>
    ),
    description:
      "Diese Checkout-Sitzung wurde nicht abgeschlossen. Kehre zu den Editionen zurück, wenn du es erneut versuchen möchtest.",
  },
  refunded: {
    eyebrow: "Bestellung erstattet",
    title: (
      <>
        Das Geld ist auf dem <em>Rückweg.</em>
      </>
    ),
    description:
      "Das Studio hat die Bestellung über Stripe erstattet. Je nach Bank kann die Gutschrift einige Werktage dauern.",
  },
  invalid: {
    eyebrow: "Bestellung nicht gefunden",
    title: (
      <>
        Dieser Link enthält keine <em>Bestellung.</em>
      </>
    ),
    description:
      "Für diese Seite wurde keine gültige Stripe-Checkout-Sitzung gefunden. Es wird kein Zahlungsstatus bestätigt.",
  },
  unavailable: {
    eyebrow: "Bestätigung nicht verfügbar",
    title: (
      <>
        Bewahre deinen <em>Beleg auf.</em>
      </>
    ),
    description:
      "Das Studio kann diese Bestellung gerade nicht verifizieren. Maßgeblich bleibt dein Stripe-Beleg; wende dich bei Fragen an das Studio.",
  },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessProps) {
  const { session_id: sessionId } = await searchParams;
  const state = await confirmationState(sessionId);
  const message = content[state];

  return (
    <>
      <SiteHeader />
      <main className="success-page" id="main-content">
        <div className="site-shell success-page__inner">
          <p className="eyebrow">{message.eyebrow}</p>
          <h1 className="display">{message.title}</h1>
          <p>{message.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link className="button button--ember" href="/">
              Zurück zum Portfolio
            </Link>
            <Link className="button" href="/doom">
              Digitale Galerie betreten ↗
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
