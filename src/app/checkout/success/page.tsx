import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Order Received",
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
    eyebrow: "Payment received",
    title: (
      <>
        The work is <em>yours.</em>
      </>
    ),
    description:
      "Thank you for supporting an independent studio. Your receipt is on its way, and the studio will send another note when the edition is ready to leave.",
  },
  processing: {
    eyebrow: "Payment processing",
    title: (
      <>
        We’re confirming <em>the signal.</em>
      </>
    ),
    description:
      "Stripe has returned you to the studio and the payment confirmation is still arriving. Your order remains reserved; watch your inbox for the receipt.",
  },
  cancelled: {
    eyebrow: "Checkout incomplete",
    title: (
      <>
        Nothing was <em>charged.</em>
      </>
    ),
    description:
      "This Checkout Session did not complete. Return to the editions page whenever you are ready to try again.",
  },
  refunded: {
    eyebrow: "Order refunded",
    title: (
      <>
        Funds are on their <em>way back.</em>
      </>
    ),
    description:
      "The studio has refunded this order through Stripe. Your bank may need several business days to show the credit.",
  },
  invalid: {
    eyebrow: "Order not found",
    title: (
      <>
        This link has no <em>order.</em>
      </>
    ),
    description:
      "A valid Stripe Checkout Session was not found for this page. No payment status is being claimed.",
  },
  unavailable: {
    eyebrow: "Confirmation unavailable",
    title: (
      <>
        Keep your <em>receipt.</em>
      </>
    ),
    description:
      "The studio cannot verify this order right now. Your Stripe receipt remains authoritative; please contact the studio if you need help.",
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
              Return to the portfolio
            </Link>
            <Link className="button" href="/doom">
              Enter the digital gallery ↗
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
