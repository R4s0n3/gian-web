import "server-only";

import type Stripe from "stripe";

import type { Prisma } from "../../generated/prisma";
import { db } from "@/server/db";
import { getStripeClient } from "@/server/stripe";

const orderInclude = {
  items: {
    include: { product: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export type OrderOperationErrorCode =
  "NOT_FOUND" | "INVALID_TRANSITION" | "PAYMENT_PENDING" | "SESSION_MISMATCH";

export class OrderOperationError extends Error {
  constructor(
    public readonly code: OrderOperationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OrderOperationError";
  }
}

export const orderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const CHECKOUT_APPLICATION = "gianweb";

export type OrderStatus = (typeof orderStatuses)[number];

function paymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? undefined;
}

function boundedValue(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function addressJson(
  address: Stripe.Address | null | undefined,
): Prisma.InputJsonObject | undefined {
  if (!address) return undefined;

  return {
    city: address.city,
    country: address.country,
    line1: address.line1,
    line2: address.line2,
    postalCode: address.postal_code,
    state: address.state,
  };
}

export function extractCheckoutCustomerDetails(
  session: Stripe.Checkout.Session,
) {
  const shipping = session.collected_information?.shipping_details;
  const customer = session.customer_details;

  return {
    customerName: boundedValue(
      shipping?.name ??
        session.collected_information?.individual_name ??
        customer?.name,
      160,
    ),
    shippingAddress: addressJson(shipping?.address ?? customer?.address),
    shippingPhone: boundedValue(customer?.phone, 40),
  } satisfies Prisma.OrderUpdateManyMutationInput;
}

function checkoutSessionFields(
  session: Stripe.Checkout.Session,
): Prisma.OrderUpdateManyMutationInput {
  return {
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId(session),
    ...extractCheckoutCustomerDetails(session),
  };
}

function orderIdForSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (
    session.metadata?.application !== CHECKOUT_APPLICATION ||
    !orderId ||
    session.client_reference_id !== orderId
  ) {
    throw new OrderOperationError(
      "SESSION_MISMATCH",
      "Stripe session order metadata and client reference do not match",
    );
  }
  return orderId;
}

function validateCheckoutSession(
  session: Stripe.Checkout.Session,
  order: OrderWithItems,
) {
  const sessionEmail =
    session.customer_details?.email ?? session.customer_email;
  const mismatches = [
    session.metadata?.application !== CHECKOUT_APPLICATION
      ? "application marker"
      : undefined,
    session.mode !== "payment" ? "mode" : undefined,
    session.client_reference_id !== order.id ? "order reference" : undefined,
    session.metadata?.orderId !== order.id ? "order metadata" : undefined,
    order.stripeCheckoutSessionId &&
    order.stripeCheckoutSessionId !== session.id
      ? "Checkout Session ID"
      : undefined,
    order.stripePaymentIntentId &&
    order.stripePaymentIntentId !== paymentIntentId(session)
      ? "PaymentIntent ID"
      : undefined,
    session.amount_total !== order.totalCents ? "amount" : undefined,
    session.currency?.toUpperCase() !== order.currency.toUpperCase()
      ? "currency"
      : undefined,
    sessionEmail?.trim().toLowerCase() !== order.email.trim().toLowerCase()
      ? "customer email"
      : undefined,
  ].filter((value): value is string => Boolean(value));

  if (mismatches.length > 0) {
    throw new OrderOperationError(
      "SESSION_MISMATCH",
      `Stripe session does not match the order: ${mismatches.join(", ")}`,
    );
  }
}

async function requireOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) {
    throw new OrderOperationError("NOT_FOUND", "Order not found");
  }
  return order;
}

async function restoreInventory(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  const items = await transaction.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });

  for (const item of items) {
    if (!item.productId) continue;

    await transaction.product.updateMany({
      where: { id: item.productId, inventory: { not: null } },
      data: { inventory: { increment: item.quantity } },
    });
  }
}

async function reserveRecoveredInventory(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  const items = await transaction.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });

  for (const item of items) {
    if (!item.productId) continue;

    const reserved = await transaction.product.updateMany({
      where: {
        id: item.productId,
        inventory: { gte: item.quantity },
      },
      data: { inventory: { decrement: item.quantity } },
    });

    if (reserved.count === 0) {
      // The schema forbids negative inventory. Preserve the paid order and
      // represent an oversold finite product as zero stock.
      const exhausted = await transaction.product.updateMany({
        where: { id: item.productId, inventory: { not: null } },
        data: { inventory: 0 },
      });
      if (exhausted.count === 1) {
        console.error(
          `Paid order ${orderId} exceeded restored inventory for product ${item.productId}`,
        );
      }
    }
  }
}

async function getOrderInTransaction(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  const order = await transaction.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) {
    throw new OrderOperationError("NOT_FOUND", "Order not found");
  }
  return order;
}

async function cancelWithoutCheckoutSession(orderId: string) {
  return db.$transaction(async (transaction) => {
    const cancelled = await transaction.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
        stripeCheckoutSessionId: null,
      },
      data: { status: "CANCELLED" },
    });

    if (cancelled.count === 1) {
      await restoreInventory(transaction, orderId);
    }

    return {
      order: await getOrderInTransaction(transaction, orderId),
      cancelled: cancelled.count === 1,
    };
  });
}

export async function cancelOrderForTerminalSession(
  session: Stripe.Checkout.Session,
) {
  const orderId = orderIdForSession(session);
  validateCheckoutSession(session, await requireOrder(orderId));

  return db.$transaction(async (transaction) => {
    const cancelled = await transaction.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
        OR: [
          { stripeCheckoutSessionId: null },
          { stripeCheckoutSessionId: session.id },
        ],
      },
      data: {
        status: "CANCELLED",
        ...checkoutSessionFields(session),
      },
    });

    if (cancelled.count === 1) {
      await restoreInventory(transaction, orderId);
    } else {
      await transaction.order.updateMany({
        where: {
          id: orderId,
          status: "CANCELLED",
          OR: [
            { stripeCheckoutSessionId: null },
            { stripeCheckoutSessionId: session.id },
          ],
        },
        data: checkoutSessionFields(session),
      });
    }

    const order = await getOrderInTransaction(transaction, orderId);
    validateCheckoutSession(session, order);
    return { order, cancelled: cancelled.count === 1 };
  });
}

export async function recordCheckoutSession(
  session: Stripe.Checkout.Session,
  markPaid: boolean,
) {
  const orderId = orderIdForSession(session);
  validateCheckoutSession(session, await requireOrder(orderId));

  if (
    markPaid &&
    (session.status !== "complete" || session.payment_status !== "paid")
  ) {
    throw new OrderOperationError(
      "SESSION_MISMATCH",
      "Stripe Checkout Session is not complete and paid",
    );
  }

  if (!markPaid) {
    await db.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
        OR: [
          { stripeCheckoutSessionId: null },
          { stripeCheckoutSessionId: session.id },
        ],
      },
      data: checkoutSessionFields(session),
    });
    const order = await requireOrder(orderId);
    validateCheckoutSession(session, order);
    return order;
  }

  return db.$transaction(async (transaction) => {
    const paidFromPending = await transaction.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
        OR: [
          { stripeCheckoutSessionId: null },
          { stripeCheckoutSessionId: session.id },
        ],
      },
      data: {
        status: "PAID",
        ...checkoutSessionFields(session),
      },
    });

    if (paidFromPending.count === 0) {
      const recoveredFromCancellation = await transaction.order.updateMany({
        where: {
          id: orderId,
          status: "CANCELLED",
          OR: [
            { stripeCheckoutSessionId: null },
            { stripeCheckoutSessionId: session.id },
          ],
        },
        data: {
          status: "PAID",
          ...checkoutSessionFields(session),
        },
      });

      if (recoveredFromCancellation.count === 1) {
        await reserveRecoveredInventory(transaction, orderId);
      } else {
        await transaction.order.updateMany({
          where: {
            id: orderId,
            status: { in: ["PAID", "PROCESSING", "FULFILLED", "REFUNDED"] },
            OR: [
              { stripeCheckoutSessionId: null },
              { stripeCheckoutSessionId: session.id },
            ],
          },
          data: checkoutSessionFields(session),
        });
      }
    }

    const order = await getOrderInTransaction(transaction, orderId);
    validateCheckoutSession(session, order);
    return order;
  });
}

function isPaidOrder(order: OrderWithItems) {
  return (
    order.status === "PAID" ||
    order.status === "PROCESSING" ||
    order.status === "FULFILLED" ||
    order.status === "REFUNDED"
  );
}

async function rejectIfSessionPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  await recordCheckoutSession(session, true);
  throw new OrderOperationError(
    "INVALID_TRANSITION",
    "The order has already been paid and cannot be cancelled",
  );
}

export async function cancelPendingOrder(
  orderId: string,
  knownSessionId?: string,
) {
  let order = await requireOrder(orderId);

  if (isPaidOrder(order)) {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      `A ${order.status.toLowerCase()} order cannot be cancelled`,
    );
  }
  if (order.status !== "PENDING" && order.status !== "CANCELLED") {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      `${order.status} cannot transition to CANCELLED`,
    );
  }

  const sessionId = knownSessionId ?? order.stripeCheckoutSessionId;
  if (!sessionId) {
    const result = await cancelWithoutCheckoutSession(orderId);
    if (!result.cancelled && result.order.status !== "CANCELLED") {
      throw new OrderOperationError(
        "INVALID_TRANSITION",
        `Order became ${result.order.status} before it could be cancelled`,
      );
    }
    return result.order;
  }

  const stripe = getStripeClient();
  let session = await stripe.checkout.sessions.retrieve(sessionId);
  validateCheckoutSession(session, order);
  await rejectIfSessionPaid(session);

  if (session.status === "open") {
    try {
      session = await stripe.checkout.sessions.expire(sessionId);
    } catch (error) {
      const latestSession = await stripe.checkout.sessions.retrieve(sessionId);
      validateCheckoutSession(latestSession, order);
      await rejectIfSessionPaid(latestSession);
      throw error;
    }
  }

  await rejectIfSessionPaid(session);
  if (session.status !== "expired") {
    throw new OrderOperationError(
      "PAYMENT_PENDING",
      "Stripe Checkout has completed but payment is still processing",
    );
  }

  const result = await cancelOrderForTerminalSession(session);
  order = result.order;
  if (isPaidOrder(order)) {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      "The order was paid before cancellation completed",
    );
  }
  if (order.status !== "CANCELLED") {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      `Order became ${order.status} before it could be cancelled`,
    );
  }
  return order;
}

async function refundOrder(order: OrderWithItems) {
  let paymentIntent = order.stripePaymentIntentId;

  if (!paymentIntent && order.stripeCheckoutSessionId) {
    const session = await getStripeClient().checkout.sessions.retrieve(
      order.stripeCheckoutSessionId,
    );
    validateCheckoutSession(session, order);
    if (session.payment_status !== "paid") {
      throw new OrderOperationError(
        "INVALID_TRANSITION",
        "Stripe does not report this order as paid",
      );
    }
    await recordCheckoutSession(session, true);
    paymentIntent = paymentIntentId(session) ?? null;
  }

  if (!paymentIntent) {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      "The order has no Stripe PaymentIntent to refund",
    );
  }

  const stripe = getStripeClient();
  const existingRefunds = await stripe.refunds.list({
    payment_intent: paymentIntent,
    limit: 10,
  });
  const existingRefund = existingRefunds.data.find(
    (refund) => refund.metadata?.orderId === order.id,
  );
  const refund = existingRefund
    ? await stripe.refunds.retrieve(existingRefund.id)
    : await stripe.refunds.create(
        {
          payment_intent: paymentIntent,
          reason: "requested_by_customer",
          metadata: { orderId: order.id },
        },
        { idempotencyKey: `order-refund:${order.id}` },
      );

  if (refund.status === "failed" || refund.status === "canceled") {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      `Stripe refund ${refund.id} was ${refund.status}`,
    );
  }
  if (refund.status !== "succeeded") {
    throw new OrderOperationError(
      "PAYMENT_PENDING",
      `Stripe refund ${refund.id} is ${refund.status ?? "pending"}`,
    );
  }

  await db.order.updateMany({
    where: {
      id: order.id,
      status: { in: ["PAID", "PROCESSING", "FULFILLED"] },
    },
    data: {
      status: "REFUNDED",
      stripePaymentIntentId: paymentIntent,
    },
  });

  return requireOrder(order.id);
}

const directTransitions: Partial<Record<OrderStatus, readonly OrderStatus[]>> =
  {
    PAID: ["PROCESSING"],
    PROCESSING: ["FULFILLED"],
  };

export async function updateOrderStatus(
  orderId: string,
  targetStatus: OrderStatus,
) {
  const order = await requireOrder(orderId);

  if (targetStatus === "CANCELLED") {
    return cancelPendingOrder(orderId);
  }
  if (order.status === targetStatus) return order;
  if (targetStatus === "REFUNDED") {
    if (
      order.status !== "PAID" &&
      order.status !== "PROCESSING" &&
      order.status !== "FULFILLED"
    ) {
      throw new OrderOperationError(
        "INVALID_TRANSITION",
        `${order.status} cannot transition to REFUNDED`,
      );
    }
    return refundOrder(order);
  }

  const allowedTargets = directTransitions[order.status] ?? [];
  if (!allowedTargets.includes(targetStatus)) {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      `${order.status} cannot transition to ${targetStatus}`,
    );
  }

  const changed = await db.order.updateMany({
    where: { id: orderId, status: order.status },
    data: { status: targetStatus },
  });
  if (changed.count !== 1) {
    throw new OrderOperationError(
      "INVALID_TRANSITION",
      "The order changed while its status was being updated",
    );
  }

  return requireOrder(orderId);
}
