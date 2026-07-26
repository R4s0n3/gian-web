"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import { formatMoney, type ProductItem } from "@/app/_lib/content-shared";

type CheckoutResponse = {
  url?: string;
  orderId?: string;
  error?: string;
};

export function ShopClient({ products }: { products: ProductItem[] }) {
  const [email, setEmail] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "info";
    text: string;
  } | null>(null);

  function quantityFor(productId: string) {
    return quantities[productId] ?? 1;
  }

  async function checkout(product: ProductItem) {
    setMessage(null);

    if (!email.trim()) {
      setMessage({
        tone: "error",
        text: "Gib oben deine E-Mail-Adresse ein, damit das Studio dir den Beleg senden kann.",
      });
      return;
    }

    if (product.id.startsWith("fallback-")) {
      setMessage({
        tone: "info",
        text: "Dies ist eine Vorschau-Edition. Der Kauf wird möglich, sobald das Studio den Bestand veröffentlicht.",
      });
      return;
    }

    setLoadingId(product.id);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          items: [
            {
              productId: product.id,
              quantity: quantityFor(product.id),
            },
          ],
        }),
      });
      const result = (await response.json()) as CheckoutResponse;

      if (!response.ok || !result.url) {
        throw new Error(
          result.error ?? "Der Checkout konnte nicht gestartet werden.",
        );
      }

      window.location.assign(result.url);
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Der Checkout konnte nicht gestartet werden. Bitte versuche es erneut.",
      });
      setLoadingId(null);
    }
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: "1rem",
          alignItems: "end",
          maxWidth: "42rem",
          marginBottom: "3rem",
        }}
      >
        <div className="form-field">
          <label htmlFor="checkout-email">E-Mail für den Beleg</label>
          <input
            autoComplete="email"
            className="form-input"
            id="checkout-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </div>
        <span className="eyebrow">Sicherer Stripe-Checkout</span>
      </div>

      {message && (
        <p
          aria-live="polite"
          className={
            message.tone === "error"
              ? "form-status form-status--error"
              : "form-status"
          }
          style={{ marginBottom: "2rem" }}
        >
          {message.text}
        </p>
      )}

      <div className="shop-grid">
        {products.map((product) => {
          const quantity = quantityFor(product.id);
          const maxQuantity =
            product.inventory === null
              ? 10
              : Math.max(1, Math.min(product.inventory, 10));
          const soldOut = product.inventory === 0;

          return (
            <article className="shop-card" key={product.id}>
              <div className="shop-card__image">
                <img
                  alt={`${product.name}, eine Studio-Edition von Gian`}
                  loading="lazy"
                  src={product.imageUrl}
                />
              </div>
              <div className="shop-card__body">
                <div className="shop-card__head">
                  <h2 className="product-card__title">{product.name}</h2>
                  <span className="product-card__price">
                    {formatMoney(product.priceCents, product.currency)}
                  </span>
                </div>
                <p>{product.description}</p>
                <div className="shop-card__actions">
                  <label className="sr-only" htmlFor={`quantity-${product.id}`}>
                    Anzahl für {product.name}
                  </label>
                  <input
                    className="quantity-input"
                    id={`quantity-${product.id}`}
                    max={maxQuantity}
                    min={1}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [product.id]: Math.max(
                          1,
                          Math.min(
                            maxQuantity,
                            Number(event.target.value) || 1,
                          ),
                        ),
                      }))
                    }
                    type="number"
                    value={quantity}
                  />
                  <button
                    className="button button--ember"
                    disabled={loadingId !== null || soldOut}
                    onClick={() => void checkout(product)}
                    type="button"
                  >
                    {soldOut
                      ? "Ausverkauft"
                      : loadingId === product.id
                        ? "Checkout wird geöffnet…"
                        : "Mit Stripe kaufen →"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
