import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Studioverwaltung",
    template: "%s — GIAN-LUCA Studio",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#10100e",
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
