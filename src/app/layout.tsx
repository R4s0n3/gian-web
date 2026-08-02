import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Gian-Luca Blasius — Zeitgenössische Kunst",
    template: "%s — Gian-Luca Blasius",
  },
  description:
    "Gemälde, Fotografien, limitierte Editionen und eine digitale Galerie von Gian-Luca Blasius.",
  applicationName: "Gian-Luca Blasius",
  authors: [{ name: "Gian-Luca Blasius" }],
  keywords: [
    "zeitgenössische Kunst",
    "Tätowierer",
    "Kunst",
    "Künstlerportfolio",
    "immersive Galerie",
  ],
  openGraph: {
    title: "Gian-Luca Blasius — Zeitgenössische Kunst",
    description:
      "Gemälde und Fotografien zwischen Kontrolle, Instinkt und bewusster Spur.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/logo.svg",
        width: 1024,
        height: 1024,
        alt: "Threshold I, eine originale Mixed-Media-Arbeit von GIAN-LUCA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gian-Luca Blasius — Zeitgenössische Kunst",
    description:
      "Gemälde und Fotografien zwischen Kontrolle, Instinkt und bewusster Spur.",
    images: ["/logo.svg"],
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
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
