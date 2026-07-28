"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="admin-icon-button"
      onClick={() => void signOut({ callbackUrl: "/admin/login" })}
      type="button"
    >
      Abmelden
    </button>
  );
}
