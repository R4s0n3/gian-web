import { ProductManager } from "@/app/admin/(dashboard)/products/product-manager";

export default function AdminProductsPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Commerce / catalogue</p>
          <h1 className="display">Studio editions.</h1>
        </div>
        <span className="status-pill status-pill--active">Stripe ready</span>
      </header>
      <ProductManager />
    </>
  );
}
