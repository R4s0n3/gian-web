import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

export class StripeConfigurationError extends Error {
  constructor(variable: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET") {
    super(`${variable} is not configured`);
    this.name = "StripeConfigurationError";
  }
}

let stripeClient: Stripe | undefined;

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new StripeConfigurationError("STRIPE_SECRET_KEY");
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export function getStripeWebhookSecret() {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new StripeConfigurationError("STRIPE_WEBHOOK_SECRET");
  }

  return env.STRIPE_WEBHOOK_SECRET;
}
