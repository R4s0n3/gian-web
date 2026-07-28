import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Studioverwaltung",
    template: "%s — GIAN-LUCA Studio",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
