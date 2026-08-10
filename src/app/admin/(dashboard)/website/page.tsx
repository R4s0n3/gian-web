import { WebsiteSettingsForm } from "@/app/admin/(dashboard)/website/website-settings-form";

export default function AdminWebsitePage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Öffentlicher Auftritt</p>
          <h1 className="display">Website.</h1>
        </div>
        <span className="status-pill status-pill--active">Hero-Karussell</span>
      </header>
      <WebsiteSettingsForm />
    </>
  );
}
