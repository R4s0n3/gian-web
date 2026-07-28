import { ProductManager } from "@/app/admin/(dashboard)/products/product-manager";

export default function AdminProductsPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Shop / Katalog</p>
          <h1 className="display">Studioeditionen.</h1>
        </div>
        <span className="status-pill status-pill--active">Stripe bereit</span>
      </header>
      <ProductManager />
    </>
  );
}
