import { GalleryManager } from "@/app/admin/(dashboard)/gallery/gallery-manager";

export default function AdminGalleryPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Portfolioinhalte</p>
          <h1 className="display">Galeriearchiv.</h1>
        </div>
        <span className="status-pill status-pill--active">Live-Ansicht</span>
      </header>
      <GalleryManager />
    </>
  );
}
