"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import { formatMoney } from "@/app/_lib/content-shared";
import { ImageUrlField } from "@/app/admin/_components/image-url-field";
import { api } from "@/trpc/react";

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: string;
  inventory: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  price: "",
  inventory: "",
  sortOrder: "0",
  active: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductManager() {
  const utils = api.useUtils();
  const products = api.product.adminList.useQuery();
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const finishMutation = async () => {
    await utils.product.adminList.invalidate();
    await utils.product.publicList.invalidate();
    setForm(emptyForm);
    setEditingId(null);
  };

  const createProduct = api.product.create.useMutation({
    onSuccess: finishMutation,
  });
  const updateProduct = api.product.update.useMutation({
    onSuccess: finishMutation,
  });
  const deleteProduct = api.product.delete.useMutation({
    onSuccess: async () => {
      await utils.product.adminList.invalidate();
      await utils.product.publicList.invalidate();
    },
  });

  const pending =
    createProduct.isPending ||
    updateProduct.isPending ||
    deleteProduct.isPending;
  const busy = pending || imageUploading;
  const mutationError =
    createProduct.error ?? updateProduct.error ?? deleteProduct.error;

  function update<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>{editingId ? "Edit product" : "Add product"}</h2>
          {editingId && (
            <button
              className="admin-icon-button"
              disabled={imageUploading}
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              type="button"
            >
              Cancel edit
            </button>
          )}
        </div>
        <div className="admin-panel__body">
          <form
            className="admin-form"
            onSubmit={(event) => {
              event.preventDefault();
              const values = {
                name: form.name.trim(),
                slug: form.slug.trim(),
                description: form.description.trim() || null,
                imageUrl: form.imageUrl.trim() || null,
                priceCents: Math.round(Number(form.price) * 100),
                currency: "EUR",
                inventory:
                  form.inventory === "" ? null : Number(form.inventory),
                sortOrder: Number(form.sortOrder) || 0,
                active: form.active,
              };

              if (editingId) {
                updateProduct.mutate({ id: editingId, ...values });
              } else {
                createProduct.mutate(values);
              }
            }}
          >
            <div className="form-field">
              <label htmlFor="product-name">Product name</label>
              <input
                className="form-input"
                id="product-name"
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    slug:
                      !editingId &&
                      (!current.slug || current.slug === slugify(current.name))
                        ? slugify(name)
                        : current.slug,
                  }));
                }}
                placeholder="Threshold I / Archival print"
                required
                value={form.name}
              />
            </div>
            <div className="form-field">
              <label htmlFor="product-slug">URL slug</label>
              <input
                className="form-input"
                id="product-slug"
                onChange={(event) => update("slug", event.target.value)}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="threshold-i-archival-print"
                required
                value={form.slug}
              />
            </div>
            <ImageUrlField
              disabled={pending}
              id="product-image"
              key={editingId ?? "new"}
              label="Image URL (optional)"
              onBusyChange={setImageUploading}
              onChange={(value) => update("imageUrl", value)}
              placeholder="/artworks/threshold-i.webp"
              value={form.imageUrl}
            />
            <div className="form-field">
              <label htmlFor="product-description">Description</label>
              <textarea
                className="form-textarea"
                id="product-description"
                onChange={(event) => update("description", event.target.value)}
                placeholder="Edition, material, size, and fulfilment details."
                value={form.description}
              />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="product-price">Price</label>
                <input
                  className="form-input"
                  id="product-price"
                  min="0.01"
                  onChange={(event) => update("price", event.target.value)}
                  placeholder="145.00"
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </div>
              <div className="form-field">
                <label htmlFor="product-currency">Currency (fixed)</label>
                <input
                  className="form-input"
                  id="product-currency"
                  maxLength={3}
                  minLength={3}
                  readOnly
                  required
                  value="EUR"
                />
              </div>
              <div className="form-field">
                <label htmlFor="product-inventory">
                  Inventory (blank = unlimited)
                </label>
                <input
                  className="form-input"
                  id="product-inventory"
                  min={0}
                  onChange={(event) => update("inventory", event.target.value)}
                  type="number"
                  value={form.inventory}
                />
              </div>
              <div className="form-field">
                <label htmlFor="product-order">Sort order</label>
                <input
                  className="form-input"
                  id="product-order"
                  onChange={(event) => update("sortOrder", event.target.value)}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
            </div>
            <label className="checkbox">
              <input
                checked={form.active}
                onChange={(event) => update("active", event.target.checked)}
                type="checkbox"
              />
              <span>Active products appear publicly and can be purchased.</span>
            </label>

            {mutationError && (
              <p className="form-status form-status--error" role="alert">
                {mutationError.message}
              </p>
            )}

            <button
              className="button button--ember"
              disabled={busy}
              type="submit"
            >
              {imageUploading
                ? "Uploading image…"
                : pending
                  ? "Saving…"
                  : editingId
                    ? "Update product"
                    : "Create product"}
            </button>
          </form>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Product catalogue</h2>
          <span className="status-pill">
            {products.data?.length ?? 0} products
          </span>
        </div>
        {products.isLoading ? (
          <div className="admin-loading">Loading the catalogue…</div>
        ) : products.error ? (
          <div className="admin-empty">{products.error.message}</div>
        ) : products.data?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.data.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-table__title">
                        <img
                          alt=""
                          className="admin-table__thumb"
                          src={
                            product.imageUrl ?? "/artworks/blue-reliquary.webp"
                          }
                        />
                        <span>
                          <strong>{product.name}</strong>
                          <br />
                          <span style={{ color: "var(--bone-dim)" }}>
                            /{product.slug}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>{formatMoney(product.priceCents, product.currency)}</td>
                    <td>{product.inventory ?? "∞"}</td>
                    <td>
                      <span
                        className={`status-pill status-pill--${product.active ? "active" : "draft"}`}
                      >
                        {product.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-icon-button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(product.id);
                            setForm({
                              name: product.name,
                              slug: product.slug,
                              description: product.description ?? "",
                              imageUrl: product.imageUrl ?? "",
                              price: (product.priceCents / 100).toFixed(2),
                              inventory: product.inventory?.toString() ?? "",
                              sortOrder: product.sortOrder.toString(),
                              active: product.active,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="admin-icon-button"
                          disabled={busy}
                          onClick={() =>
                            updateProduct.mutate({
                              id: product.id,
                              active: !product.active,
                            })
                          }
                          type="button"
                        >
                          {product.active ? "Hide" : "Activate"}
                        </button>
                        <button
                          className="admin-icon-button admin-icon-button--danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Permanently delete “${product.name}”? Existing orders keep a snapshot.`,
                              )
                            ) {
                              deleteProduct.mutate({ id: product.id });
                            }
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            No products yet. Build the first studio edition here.
          </div>
        )}
      </section>
    </div>
  );
}
