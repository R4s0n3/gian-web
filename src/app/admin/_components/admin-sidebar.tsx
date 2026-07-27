import Link from "next/link";

import { SignOutButton } from "@/app/admin/_components/sign-out-button";

const adminNavigation = [
  { href: "/admin", label: "Overview", index: "01" },
  { href: "/admin/gallery", label: "Gallery", index: "02" },
  { href: "/admin/media", label: "Media", index: "03" },
  { href: "/admin/products", label: "Products", index: "04" },
  { href: "/admin/orders", label: "Orders", index: "05" },
  { href: "/admin/bookings", label: "Bookings", index: "06" },
];

export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__head">
        <Link className="site-logo" href="/admin">
          <span className="site-logo__mark">Gian</span>
        </Link>
        <span>Studio control / private</span>
      </div>

      <nav className="admin-nav" aria-label="Studio administration">
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
            View site ↗
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
