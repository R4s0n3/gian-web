/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/admin/login/login-form";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Admin-Anmeldung",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function safeCallbackUrl(value?: string) {
  if (!value || /\\|%5c/i.test(value)) return "/admin";

  try {
    const decoded = decodeURIComponent(value);
    if (/\\|[\r\n\0]/.test(decoded)) return "/admin";

    const base = new URL("https://studio.invalid");
    const target = new URL(decoded, base);
    const isAdminPath =
      target.pathname === "/admin" || target.pathname.startsWith("/admin/");

    return target.origin === base.origin && isAdminPath
      ? `${target.pathname}${target.search}${target.hash}`
      : "/admin";
  } catch {
    return "/admin";
  }
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const destination = safeCallbackUrl(callbackUrl);

  if (session?.user?.isAdmin) {
    redirect(destination);
  }

  return (
    <main className="admin-login" id="main-content">
      <div className="admin-login__art" aria-hidden="true">
        <img src="/artworks/threshold-i.webp" alt="" />
        <div className="admin-login__brand">
          <p className="eyebrow">Privates Studiosystem</p>
          <h1 className="display">Hinter den Werken.</h1>
        </div>
      </div>

      <div className="admin-login__panel">
        <Link className="site-logo" href="/" aria-label="Zurück zum Portfolio">
          <span className="site-logo__mark">Gian</span>
          <span className="site-logo__descriptor">Zurück zum Portfolio</span>
        </Link>
        <p className="eyebrow" style={{ marginTop: "4rem" }}>
          Nur für autorisierte Administratoren
        </p>
        <h2 className="display">Studiozugang.</h2>
        <p>
          Verwalte Werke, Editionen, Bestellungen und Terminanfragen an einem
          privaten Ort.
        </p>
        <LoginForm callbackUrl={destination} />
      </div>
    </main>
  );
}
