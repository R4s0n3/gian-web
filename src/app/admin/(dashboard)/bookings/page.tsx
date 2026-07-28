import { BookingManager } from "@/app/admin/(dashboard)/bookings/booking-manager";

export default function AdminBookingsPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Studiokalender / Anfragen</p>
          <h1 className="display">Termine.</h1>
        </div>
        <span className="status-pill status-pill--pending">Zu prüfen</span>
      </header>
      <BookingManager />
    </>
  );
}
