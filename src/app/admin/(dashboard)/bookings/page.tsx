import { BookingManager } from "@/app/admin/(dashboard)/bookings/booking-manager";

export default function AdminBookingsPage() {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Studio diary / requests</p>
          <h1 className="display">Bookings.</h1>
        </div>
        <span className="status-pill status-pill--pending">Needs review</span>
      </header>
      <BookingManager />
    </>
  );
}
