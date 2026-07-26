"use client";

import { formatMoney } from "@/app/_lib/content-shared";
import { api } from "@/trpc/react";

const orderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof orderStatuses)[number];

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PENDING", "CANCELLED"],
  PAID: ["PAID", "PROCESSING", "REFUNDED"],
  PROCESSING: ["PROCESSING", "FULFILLED", "REFUNDED"],
  FULFILLED: ["FULFILLED", "REFUNDED"],
  CANCELLED: ["CANCELLED"],
  REFUNDED: ["REFUNDED"],
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function addressLines(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  const address = value as Record<string, unknown>;
  const stringValue = (key: string) =>
    typeof address[key] === "string" ? address[key] : "";
  const locality = [
    stringValue("postalCode") || stringValue("postal_code"),
    stringValue("city"),
    stringValue("state"),
  ]
    .filter(Boolean)
    .join(" ");

  return [
    stringValue("line1"),
    stringValue("line2"),
    locality,
    stringValue("country"),
  ].filter(Boolean);
}

export function OrderManager() {
  const utils = api.useUtils();
  const orders = api.order.adminList.useQuery();
  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.order.adminList.invalidate();
    },
  });

  if (orders.isLoading) {
    return (
      <section className="admin-panel">
        <div className="admin-loading">Loading the order ledger…</div>
      </section>
    );
  }

  if (orders.error) {
    return (
      <section className="admin-panel">
        <div className="admin-empty">{orders.error.message}</div>
      </section>
    );
  }

  if (!orders.data?.length) {
    return (
      <section className="admin-panel">
        <div className="admin-empty">
          No orders yet. New Stripe checkouts will appear here automatically.
        </div>
      </section>
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <h2>Order ledger</h2>
        <span className="status-pill">{orders.data.length} orders</span>
      </div>

      {updateStatus.error && (
        <p
          className="form-status form-status--error"
          role="alert"
          style={{ padding: "1rem" }}
        >
          {updateStatus.error.message}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Contents</th>
              <th>Total</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {orders.data.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                  {order.stripeCheckoutSessionId && (
                    <>
                      <br />
                      <span
                        title={order.stripeCheckoutSessionId}
                        style={{ color: "var(--bone-dim)" }}
                      >
                        Stripe linked
                      </span>
                    </>
                  )}
                </td>
                <td>
                  {order.customerName && (
                    <>
                      <strong>{order.customerName}</strong>
                      <br />
                    </>
                  )}
                  <a href={`mailto:${order.email}`}>{order.email}</a>
                  {order.shippingPhone && (
                    <>
                      <br />
                      <a href={`tel:${order.shippingPhone}`}>
                        {order.shippingPhone}
                      </a>
                    </>
                  )}
                  {addressLines(order.shippingAddress).length > 0 && (
                    <details style={{ marginTop: "0.5rem" }}>
                      <summary style={{ cursor: "pointer" }}>
                        Shipping address
                      </summary>
                      <address
                        style={{
                          marginTop: "0.5rem",
                          color: "var(--bone-dim)",
                          fontStyle: "normal",
                        }}
                      >
                        {addressLines(order.shippingAddress).map(
                          (line, index) => (
                            <span key={`${index}-${line}`}>
                              {line}
                              <br />
                            </span>
                          ),
                        )}
                      </address>
                    </details>
                  )}
                </td>
                <td>
                  <details>
                    <summary style={{ cursor: "pointer" }}>
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}{" "}
                      item
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      ) === 1
                        ? ""
                        : "s"}
                    </summary>
                    <ul
                      style={{
                        display: "grid",
                        gap: "0.4rem",
                        margin: "0.8rem 0 0",
                        paddingLeft: "1rem",
                        color: "var(--bone-dim)",
                      }}
                    >
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity} × {item.productName} ·{" "}
                          {formatMoney(item.lineTotalCents, order.currency)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
                <td>{formatMoney(order.totalCents, order.currency)}</td>
                <td>
                  <label className="sr-only" htmlFor={`order-${order.id}`}>
                    Status for order {order.id}
                  </label>
                  <select
                    className="form-select"
                    disabled={updateStatus.isPending}
                    id={`order-${order.id}`}
                    onChange={(event) => {
                      const status = orderStatuses.find(
                        (item) => item === event.target.value,
                      );
                      if (status) {
                        if (
                          ["CANCELLED", "REFUNDED"].includes(status) &&
                          !window.confirm(
                            status === "REFUNDED"
                              ? `Issue a real Stripe refund of ${formatMoney(order.totalCents, order.currency)}? This action cannot be undone here.`
                              : "Expire this checkout and release its reserved inventory?",
                          )
                        ) {
                          event.target.value = order.status;
                          return;
                        }
                        updateStatus.mutate({ id: order.id, status });
                      }
                    }}
                    style={{ minHeight: "2.4rem", minWidth: "9rem" }}
                    value={order.status}
                  >
                    {allowedTransitions[order.status].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
