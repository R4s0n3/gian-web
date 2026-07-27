import { MediaManager } from "@/app/admin/(dashboard)/media/media-manager";

export default function AdminMediaPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Asset library / Cloudflare R2</p>
          <h1 className="display">Studio media.</h1>
        </div>
        <span className="status-pill status-pill--active">Image storage</span>
      </header>
      <MediaManager />
    </>
  );
}
