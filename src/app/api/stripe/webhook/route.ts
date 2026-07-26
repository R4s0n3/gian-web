import type Stripe from "stripe";
import { NextResponse } from "next/server";

import {
  cancelOrderForTerminalSession,
  CHECKOUT_APPLICATION,
  OrderOperationError,
  recordCheckoutSession,
} from "@/server/orders";
import {
  getStripeClient,
  getStripeWebhookSecret,
  StripeConfigurationError,
} from "@/server/stripe";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function claimsApplicationOrder(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.application === CHECKOUT_APPLICATION;
}

export async function POST(request: Request) {
  let stripe;
  let webhookSecret;
  try {
    stripe = getStripeClient();
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return errorResponse("Stripe webhooks are not configured", 503);
    }
    throw error;
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return errorResponse("Missing Stripe signature", 400);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return errorResponse("Invalid Stripe signature", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (!claimsApplicationOrder(session)) break;
        await recordCheckoutSession(session, session.payment_status === "paid");
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (!claimsApplicationOrder(session)) break;
        await recordCheckoutSession(session, true);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        if (!claimsApplicationOrder(session)) break;
        await cancelOrderForTerminalSession(session);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Could not process Stripe webhook", error);
    if (
      error instanceof OrderOperationError &&
      error.code === "SESSION_MISMATCH"
    ) {
      return errorResponse("Webhook order validation failed", 400);
    }
    return errorResponse("Webhook processing failed", 500);
  }

  return NextResponse.json({ received: true });
}
