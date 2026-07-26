import { OverviewClient } from "@/app/admin/(dashboard)/overview-client";

export default function AdminOverviewPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Private studio / overview</p>
          <h1 className="display">Good work starts here.</h1>
        </div>
        <span className="status-pill">Admin workspace</span>
      </header>
      <OverviewClient />
    </>
  );
}
