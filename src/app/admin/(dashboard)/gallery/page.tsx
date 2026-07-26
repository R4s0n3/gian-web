import { GalleryManager } from "@/app/admin/(dashboard)/gallery/gallery-manager";

export default function AdminGalleryPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Portfolio content</p>
          <h1 className="display">Gallery archive.</h1>
        </div>
        <span className="status-pill status-pill--active">Live feed</span>
      </header>
      <GalleryManager />
    </>
  );
}
