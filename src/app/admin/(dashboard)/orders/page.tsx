import { OrderManager } from "@/app/admin/(dashboard)/orders/order-manager";

export default function AdminOrdersPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Shop / Versand</p>
          <h1 className="display">Bestellungen.</h1>
        </div>
        <span className="status-pill">Stripe-Übersicht</span>
      </header>
      <OrderManager />
    </>
  );
}
