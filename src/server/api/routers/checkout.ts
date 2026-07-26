import type Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  cancelOrderForTerminalSession,
  cancelPendingOrder,
  CHECKOUT_APPLICATION,
  OrderOperationError,
  recordCheckoutSession,
} from "@/server/orders";
import {
  anonymizedRateLimitKey,
  consumeRateLimit,
  requesterIp,
} from "@/server/rate-limit";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getStripeClient, StripeConfigurationError } from "@/server/stripe";

const MAX_DATABASE_INT = 2_147_483_647;
const CHECKOUT_HOLD_SECONDS = 31 * 60;
const CHECKOUT_EMAIL_LIMIT = 5;
const CHECKOUT_EMAIL_WINDOW_MS = CHECKOUT_HOLD_SECONDS * 1_000;
const CHECKOUT_IP_LIMIT = 12;
const CHECKOUT_IP_WINDOW_MS = 10 * 60 * 1_000;
const CONFIRMATION_IP_LIMIT = 30;
const CONFIRMATION_IP_WINDOW_MS = 10 * 60 * 1_000;
const ACTIVE_EMAIL_RESERVATION_LIMIT = 3;

type ShippingCountry =
  Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry;

const supportedShippingCountries = new Set(
  "AC AD AE AF AG AI AL AM AO AQ AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IS IT JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MK ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VN VU WF WS XK YE YT ZA ZM ZW ZZ".split(
    " ",
  ),
);

const createCheckoutSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((email) => email.toLowerCase()),
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(191),
            quantity: z.number().int().min(1).max(10),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const seen = new Set<string>();

    items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate product IDs are not allowed",
          path: ["items", index, "productId"],
        });
      }
      seen.add(item.productId);
    });
  });

const checkoutSessionIdSchema = z
  .string()
  .trim()
  .min(4)
  .max(255)
  .regex(/^cs_[A-Za-z0-9_]+$/);

type ConfirmationState =
  "paid" | "processing" | "cancelled" | "refunded" | "invalid" | "unavailable";

class CheckoutConfigurationError extends Error {}
class CheckoutValidationError extends Error {}

class CheckoutRateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "CheckoutRateLimitError";
  }
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1" ||
    normalized === "0.0.0.0" ||
    normalized.startsWith("127.")
  );
}

function developmentOrigin(): string {
  const configuredPort = process.env.PORT;
  const port =
    configuredPort &&
    /^\d{1,5}$/.test(configuredPort) &&
    Number(configuredPort) <= 65_535
      ? configuredPort
      : "3000";
  return `http://localhost:${port}`;
}

function canonicalCheckoutOrigin(): string {
  if (!env.NEXT_PUBLIC_SITE_URL && env.NODE_ENV === "production") {
    throw new CheckoutConfigurationError(
      "NEXT_PUBLIC_SITE_URL is required in production",
    );
  }

  const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL ?? developmentOrigin());
  if (
    (siteUrl.protocol !== "https:" && siteUrl.protocol !== "http:") ||
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.pathname !== "/" ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new CheckoutConfigurationError(
      "NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin",
    );
  }
  if (env.NODE_ENV === "production" && isLocalHostname(siteUrl.hostname)) {
    throw new CheckoutConfigurationError(
      "NEXT_PUBLIC_SITE_URL cannot use a local hostname in production",
    );
  }
  if (env.NODE_ENV === "production" && siteUrl.protocol !== "https:") {
    throw new CheckoutConfigurationError(
      "NEXT_PUBLIC_SITE_URL must use HTTPS in production",
    );
  }

  return siteUrl.origin;
}

function allowedShippingCountries(): ShippingCountry[] {
  const configured = env.STRIPE_ALLOWED_SHIPPING_COUNTRIES ?? "DE";
  const countries = [
    ...new Set(
      configured
        .toUpperCase()
        .split(/[\s,]+/)
        .map((country) => country.trim())
        .filter(Boolean),
    ),
  ];

  if (countries.length === 0) {
    throw new CheckoutConfigurationError(
      "No Stripe shipping countries are configured",
    );
  }

  const unsupported = countries.filter(
    (country) => !supportedShippingCountries.has(country),
  );
  if (unsupported.length > 0) {
    throw new CheckoutConfigurationError(
      `Unsupported Stripe shipping countries: ${unsupported.join(", ")}`,
    );
  }

  return countries as ShippingCountry[];
}

function enforceCheckoutRateLimits(email: string, headers: Headers): void {
  const limits = [
    consumeRateLimit({
      key: anonymizedRateLimitKey("checkout-email", email),
      limit: CHECKOUT_EMAIL_LIMIT,
      windowMs: CHECKOUT_EMAIL_WINDOW_MS,
    }),
  ];
  const ip = requesterIp(headers);
  if (ip) {
    limits.push(
      consumeRateLimit({
        key: anonymizedRateLimitKey("checkout-ip", ip),
        limit: CHECKOUT_IP_LIMIT,
        windowMs: CHECKOUT_IP_WINDOW_MS,
      }),
    );
  }

  const blockedLimits = limits.filter((limit) => !limit.allowed);
  if (blockedLimits.length > 0) {
    throw new CheckoutRateLimitError(
      "Zu viele Checkout-Versuche. Bitte versuche es später erneut.",
      Math.max(...blockedLimits.map((limit) => limit.retryAfterSeconds)),
    );
  }
}

function enforceConfirmationRateLimit(headers: Headers): void {
  const ip = requesterIp(headers);
  if (!ip) return;

  const result = consumeRateLimit({
    key: anonymizedRateLimitKey("checkout-confirmation-ip", ip),
    limit: CONFIRMATION_IP_LIMIT,
    windowMs: CONFIRMATION_IP_WINDOW_MS,
  });
  if (!result.allowed) {
    throw new CheckoutRateLimitError(
      "Zu viele Zahlungsprüfungen. Bitte versuche es später erneut.",
      result.retryAfterSeconds,
    );
  }
}

function isMissingStripeResource(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "resource_missing"
  );
}

function confirmationStateForOrder(status: string): ConfirmationState {
  if (status === "REFUNDED") return "refunded";
  if (status === "CANCELLED") return "cancelled";
  if (status === "PENDING") return "processing";
  if (status === "PAID" || status === "PROCESSING" || status === "FULFILLED") {
    return "paid";
  }
  return "unavailable";
}

function validateSucceededPaymentIntent(
  session: Stripe.Checkout.Session,
): void {
  const paymentIntent = session.payment_intent;
  const mismatches = [
    !paymentIntent || typeof paymentIntent === "string"
      ? "expanded PaymentIntent"
      : undefined,
    typeof paymentIntent !== "string" && paymentIntent?.status !== "succeeded"
      ? "PaymentIntent status"
      : undefined,
    typeof paymentIntent !== "string" &&
    paymentIntent?.amount !== session.amount_total
      ? "PaymentIntent amount"
      : undefined,
    typeof paymentIntent !== "string" &&
    paymentIntent?.amount_received !== session.amount_total
      ? "received amount"
      : undefined,
    typeof paymentIntent !== "string" &&
    paymentIntent?.currency.toUpperCase() !== session.currency?.toUpperCase()
      ? "PaymentIntent currency"
      : undefined,
    typeof paymentIntent !== "string" &&
    paymentIntent?.metadata.application !== CHECKOUT_APPLICATION
      ? "PaymentIntent application marker"
      : undefined,
    typeof paymentIntent !== "string" &&
    paymentIntent?.metadata.orderId !== session.metadata?.orderId
      ? "PaymentIntent order metadata"
      : undefined,
  ].filter((value): value is string => Boolean(value));

  if (mismatches.length > 0) {
    throw new OrderOperationError(
      "SESSION_MISMATCH",
      `Stripe payment does not match the Checkout Session: ${mismatches.join(", ")}`,
    );
  }
}

async function createPendingOrder(input: z.infer<typeof createCheckoutSchema>) {
  return db.$transaction(
    async (transaction) => {
      const reservationWindowStart = new Date(
        Date.now() - CHECKOUT_EMAIL_WINDOW_MS,
      );
      const activeReservations = await transaction.order.findMany({
        where: {
          email: input.email,
          status: "PENDING",
          createdAt: { gte: reservationWindowStart },
        },
        orderBy: { createdAt: "asc" },
        take: ACTIVE_EMAIL_RESERVATION_LIMIT,
        select: { createdAt: true },
      });
      if (activeReservations.length >= ACTIVE_EMAIL_RESERVATION_LIMIT) {
        const oldest = activeReservations[0]?.createdAt.getTime() ?? Date.now();
        throw new CheckoutRateLimitError(
          "Für diese E-Mail-Adresse sind bereits zu viele Checkouts aktiv.",
          Math.max(
            1,
            Math.ceil((oldest + CHECKOUT_EMAIL_WINDOW_MS - Date.now()) / 1_000),
          ),
        );
      }

      const requestedIds = input.items.map((item) => item.productId);
      const products = await transaction.product.findMany({
        where: { id: { in: requestedIds }, active: true },
        select: {
          id: true,
          name: true,
          priceCents: true,
          currency: true,
          inventory: true,
        },
      });

      if (products.length !== input.items.length) {
        throw new CheckoutValidationError(
          "Ein oder mehrere Produkte sind nicht verfügbar",
        );
      }

      const productById = new Map(
        products.map((product) => [product.id, product]),
      );
      const currencies = new Set(
        products.map((product) => product.currency.toUpperCase()),
      );

      if (products.some((product) => product.currency !== "EUR")) {
        throw new CheckoutValidationError(
          "Ein oder mehrere Produkte verwenden eine nicht unterstützte Währung",
        );
      }

      if (currencies.size !== 1) {
        throw new CheckoutValidationError(
          "Alle Checkout-Artikel müssen dieselbe Währung verwenden",
        );
      }

      const currency = currencies.values().next().value;
      if (!currency) {
        throw new CheckoutValidationError(
          "Die Checkout-Währung ist nicht verfügbar",
        );
      }

      let totalCents = 0;
      const orderItems = [];

      for (const requestedItem of input.items) {
        const product = productById.get(requestedItem.productId);
        if (
          !product ||
          !Number.isSafeInteger(product.priceCents) ||
          product.priceCents <= 0
        ) {
          throw new CheckoutValidationError(
            "Ein oder mehrere Produkte haben einen ungültigen Preis",
          );
        }

        if (
          product.inventory !== null &&
          product.inventory < requestedItem.quantity
        ) {
          throw new CheckoutValidationError(
            `${product.name} ist nicht in ausreichender Stückzahl verfügbar`,
          );
        }

        const reserved = await transaction.product.updateMany({
          where: {
            id: product.id,
            active: true,
            priceCents: product.priceCents,
            currency: product.currency,
            OR: [
              { inventory: null },
              { inventory: { gte: requestedItem.quantity } },
            ],
          },
          data: { inventory: { decrement: requestedItem.quantity } },
        });

        if (reserved.count !== 1) {
          throw new CheckoutValidationError(
            `${product.name} ist in dieser Stückzahl nicht mehr verfügbar`,
          );
        }

        const lineTotalCents = product.priceCents * requestedItem.quantity;
        if (
          !Number.isSafeInteger(lineTotalCents) ||
          lineTotalCents > MAX_DATABASE_INT
        ) {
          throw new CheckoutValidationError("Der Gesamtbetrag ist zu hoch");
        }
        totalCents += lineTotalCents;
        if (
          !Number.isSafeInteger(totalCents) ||
          totalCents > MAX_DATABASE_INT
        ) {
          throw new CheckoutValidationError("Der Gesamtbetrag ist zu hoch");
        }

        orderItems.push({
          productId: product.id,
          productName: product.name,
          unitPriceCents: product.priceCents,
          quantity: requestedItem.quantity,
          lineTotalCents,
        });
      }

      return transaction.order.create({
        data: {
          email: input.email,
          status: "PENDING",
          currency,
          totalCents,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

async function createCheckoutSession(
  input: z.infer<typeof createCheckoutSchema>,
) {
  const stripe = getStripeClient();
  const shippingCountries = allowedShippingCountries();
  const canonicalOrigin = canonicalCheckoutOrigin();
  const order = await createPendingOrder(input);

  let createdSessionId: string | undefined;
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "de",
        payment_method_types: ["card"],
        billing_address_collection: "required",
        phone_number_collection: { enabled: true },
        shipping_address_collection: {
          allowed_countries: shippingCountries,
        },
        customer_email: order.email,
        client_reference_id: order.id,
        expires_at: Math.floor(Date.now() / 1_000) + CHECKOUT_HOLD_SECONDS,
        success_url: `${canonicalOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${canonicalOrigin}/shop?checkout=cancelled`,
        metadata: {
          application: CHECKOUT_APPLICATION,
          orderId: order.id,
        },
        payment_intent_data: {
          metadata: {
            application: CHECKOUT_APPLICATION,
            orderId: order.id,
          },
        },
        line_items: order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.productName,
            },
          },
        })),
      },
      { idempotencyKey: `checkout:${order.id}` },
    );
    createdSessionId = session.id;

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL");
    }

    const attached = await db.order.updateMany({
      where: {
        id: order.id,
        status: "PENDING",
        stripeCheckoutSessionId: null,
      },
      data: { stripeCheckoutSessionId: session.id },
    });
    if (attached.count !== 1) {
      throw new Error("Order is no longer pending");
    }

    return { url: session.url, orderId: order.id };
  } catch (error) {
    if (createdSessionId) {
      try {
        await stripe.checkout.sessions.expire(createdSessionId);
      } catch (expireError) {
        console.error(
          "Could not expire failed Stripe Checkout Session",
          expireError,
        );
      }
    }
    try {
      await cancelPendingOrder(order.id, createdSessionId);
    } catch (cleanupError) {
      console.error("Could not cancel failed checkout order", cleanupError);
    }
    throw error;
  }
}

async function confirmCheckoutSession(
  sessionId: string,
): Promise<ConfirmationState> {
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripeClient().checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  } catch (error) {
    if (isMissingStripeResource(error)) return "invalid";
    throw error;
  }

  try {
    if (session.status === "expired") {
      const { order } = await cancelOrderForTerminalSession(session);
      return confirmationStateForOrder(order.status);
    }

    const paid =
      session.status === "complete" && session.payment_status === "paid";
    if (paid) {
      validateSucceededPaymentIntent(session);
    }

    const order = await recordCheckoutSession(session, paid);
    return confirmationStateForOrder(order.status);
  } catch (error) {
    if (
      error instanceof OrderOperationError &&
      (error.code === "NOT_FOUND" || error.code === "SESSION_MISMATCH")
    ) {
      console.error("Stripe Checkout Session validation failed", error);
      return "invalid";
    }
    throw error;
  }
}

function checkoutError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof CheckoutRateLimitError) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `${error.message} (${error.retryAfterSeconds} Sekunden)`,
      cause: error,
    });
  }
  if (error instanceof CheckoutValidationError) {
    return new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof CheckoutConfigurationError ||
    error instanceof StripeConfigurationError
  ) {
    console.error("Checkout configuration is invalid", error);
    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Der Checkout ist vorübergehend nicht verfügbar",
      cause: error,
    });
  }

  console.error("Stripe Checkout operation failed", error);
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Der Checkout ist vorübergehend nicht verfügbar",
    cause: error,
  });
}

export const checkoutRouter = createTRPCRouter({
  createSession: publicProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        enforceCheckoutRateLimits(input.email, ctx.headers);
        return await createCheckoutSession(input);
      } catch (error) {
        throw checkoutError(error);
      }
    }),

  confirmSession: publicProcedure
    .input(z.object({ sessionId: checkoutSessionIdSchema.optional() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!input.sessionId) {
        return { state: "invalid" as const };
      }

      try {
        enforceConfirmationRateLimit(ctx.headers);
        return { state: await confirmCheckoutSession(input.sessionId) };
      } catch (error) {
        if (error instanceof CheckoutRateLimitError) {
          throw checkoutError(error);
        }
        if (
          error instanceof CheckoutConfigurationError ||
          error instanceof StripeConfigurationError
        ) {
          console.error("Checkout confirmation is not configured", error);
        } else {
          console.error("Could not confirm Stripe Checkout Session", error);
        }
        return { state: "unavailable" as const };
      }
    }),
});
