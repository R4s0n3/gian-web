import { OrderManager } from "@/app/admin/(dashboard)/orders/order-manager";

export default function AdminOrdersPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Commerce / fulfilment</p>
          <h1 className="display">Orders.</h1>
        </div>
        <span className="status-pill">Stripe ledger</span>
      </header>
      <OrderManager />
    </>
  );
}
