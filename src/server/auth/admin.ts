import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "@/env";

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function allowedAdminEmails(): readonly string[] {
  if (!env.ALLOWED_ADMIN_MAILS) return [];

  return [
    ...new Set(
      env.ALLOWED_ADMIN_MAILS.split(/[\s,;]+/)
        .map(normalizeAdminEmail)
        .filter(Boolean),
    ),
  ];
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedAdminEmails().includes(normalizeAdminEmail(email));
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    env.AUTH_SECRET?.trim() &&
    (env.ADMIN_PASSWORD?.length ?? 0) >= 16 &&
    allowedAdminEmails().length,
  );
}

export function verifyAdminPassword(password: string): boolean {
  if (!isAdminAuthConfigured() || !env.ADMIN_PASSWORD) return false;

  const provided = createHash("sha256").update(password).digest();
  const expected = createHash("sha256").update(env.ADMIN_PASSWORD).digest();
  return timingSafeEqual(provided, expected);
}

export function adminAuthVersion(): string | undefined {
  if (!isAdminAuthConfigured() || !env.ADMIN_PASSWORD) return undefined;

  return createHash("sha256")
    .update(`gian-admin-auth:${env.ADMIN_PASSWORD}`)
    .digest("hex");
}

export function adminIdForEmail(email: string): string {
  return `admin_${createHash("sha256")
    .update(normalizeAdminEmail(email))
    .digest("hex")
    .slice(0, 24)}`;
}
