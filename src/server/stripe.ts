import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

export class StripeConfigurationError extends Error {
  constructor(variable: "STRIPE_SECRET_KEY") {
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
