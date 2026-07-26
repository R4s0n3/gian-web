import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Gian — Contemporary Art & Tattoo",
    template: "%s — Gian",
  },
  description:
    "Contemporary art, tattoo work, limited objects, and an immersive digital gallery by Gian.",
  applicationName: "Gian Studio",
  authors: [{ name: "Gian" }],
  keywords: [
    "contemporary artist",
    "tattoo artist",
    "fine art",
    "artist portfolio",
    "immersive gallery",
  ],
  openGraph: {
    title: "Gian — Contemporary Art & Tattoo",
    description:
      "Original work across canvas, skin, objects, and digital space.",
    type: "website",
    images: [
      {
        url: "/artworks/threshold-i.webp",
        width: 1122,
        height: 1402,
        alt: "Threshold I, an original mixed-media artwork by Gian",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gian — Contemporary Art & Tattoo",
    description:
      "Original work across canvas, skin, objects, and digital space.",
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
    <html lang="en">
      <body className="site-body">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
