import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "GIAN-LUCA — Fine Art",
    template: "%s — GIAN-LUCA",
  },
  description:
    "Fine Art, Tattoos, limitierte Objekte und eine immersive digitale Galerie von GIAN-LUCA.",
  applicationName: "GIAN-LUCA Studio",
  authors: [{ name: "GIAN-LUCA" }],
  keywords: [
    "zeitgenössische Kunst",
    "Tätowierer",
    "Kunst",
    "Künstlerportfolio",
    "immersive Galerie",
  ],
  openGraph: {
    title: "GIAN-LUCA — Fine Art",
    description:
      "Originalarbeiten auf Leinwand, Haut, Objekten und im digitalen Raum.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/artworks/threshold-i.webp",
        width: 1122,
        height: 1402,
        alt: "Threshold I, eine originale Mixed-Media-Arbeit von GIAN-LUCA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GIAN-LUCA — Fine Art",
    description:
      "Originalarbeiten auf Leinwand, Haut, Objekten und im digitalen Raum.",
    images: ["/artworks/threshold-i.webp"],
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0a0a08",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="site-body">
        <a className="skip-link" href="#main-content">
          Zum Inhalt springen
        </a>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
