import type { Metadata } from "next";
import Link from "next/link";
import { TRPCError } from "@trpc/server";

import { PublicSite } from "@/app/_components/public-site";
import { api } from "@/trpc/server";

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
  try {
    const result = await api.checkout.confirmSession({
      sessionId,
    });
    return result.state;
  } catch (error) {
    if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
      return "invalid";
    }
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
      "Stripe meldet die Zahlung noch nicht als abgeschlossen. Deine Bestellung bleibt reserviert; lade diese Seite in einem Moment erneut, um den Status serverseitig zu prüfen.",
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
    <PublicSite>
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
              Zur Galerie ↗
            </Link>
          </div>
        </div>
      </main>
    </PublicSite>
  );
}
