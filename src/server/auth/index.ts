import NextAuth from "next-auth";
import { cache } from "react";

import { isAllowedAdminEmail } from "./admin";
import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export async function requireAdmin() {
  const session = await auth();

  if (
    session?.user?.isAdmin !== true ||
    !isAllowedAdminEmail(session.user.email)
  ) {
    throw new Error("Administrator authentication required");
  }

  return session;
}

export { auth, handlers, signIn, signOut };
export {
  adminAuthVersion,
  allowedAdminEmails,
  isAdminAuthConfigured,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from "./admin";
