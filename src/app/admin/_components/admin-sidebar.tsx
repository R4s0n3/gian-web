import Link from "next/link";

import { SignOutButton } from "@/app/admin/_components/sign-out-button";

const adminNavigation = [
  { href: "/admin", label: "Übersicht", index: "01" },
  { href: "/admin/gallery", label: "Galerie", index: "02" },
  { href: "/admin/media", label: "Medien", index: "03" },
  { href: "/admin/products", label: "Produkte", index: "04" },
  { href: "/admin/orders", label: "Bestellungen", index: "05" },
  { href: "/admin/bookings", label: "Termine", index: "06" },
];

export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__head">
        <Link className="site-logo" href="/admin">
          <span className="site-logo__mark">Gian</span>
        </Link>
        <span>Studioverwaltung / privat</span>
      </div>

      <nav className="admin-nav" aria-label="Studioverwaltung">
        {adminNavigation.map((item) => (
          <Link href={item.href} key={item.href}>
            <span>{item.label}</span>
            <span aria-hidden="true">{item.index}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar__base">
        <p title={email}>{email}</p>
        <div className="admin-actions">
          <Link className="admin-icon-button" href="/" target="_blank">
            Website ansehen ↗
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
