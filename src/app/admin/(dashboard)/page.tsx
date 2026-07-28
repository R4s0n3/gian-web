import { OverviewClient } from "@/app/admin/(dashboard)/overview-client";

export default function AdminOverviewPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Privates Studio / Übersicht</p>
          <h1 className="display">Gute Arbeit beginnt hier.</h1>
        </div>
        <span className="status-pill">Adminbereich</span>
      </header>
      <OverviewClient />
    </>
  );
}
