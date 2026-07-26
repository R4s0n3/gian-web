import { randomBytes } from "node:crypto";

import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { env } from "@/env";
import {
  adminAuthVersion,
  adminIdForEmail,
  isAdminAuthConfigured,
  isAllowedAdminEmail,
  normalizeAdminEmail,
  verifyAdminPassword,
} from "@/server/auth/admin";
import {
  anonymizedRateLimitKey,
  clearRateLimit,
  consumeRateLimit,
  inspectRateLimit,
  requesterIp,
} from "@/server/rate-limit";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
const LOGIN_FAILURE_LIMIT = 5;
const LOGIN_IP_FAILURE_LIMIT = 20;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1_000;

// Auth.js requires a secret even while Next.js collects route metadata during a
// build. A process-local fallback keeps builds healthy, while authorize() and
// signIn() still deny every login until a real AUTH_SECRET is configured.
const authSecret = env.AUTH_SECRET ?? randomBytes(32).toString("hex");

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin?: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  // Auth.js derives its action origin from the incoming host. Deploy behind a
  // proxy that replaces, rather than forwards, untrusted Host headers.
  trustHost: true,
  providers: [
    Credentials({
      name: "Administrator",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          autoComplete: "email",
        },
        password: {
          label: "Password",
          type: "password",
          autoComplete: "current-password",
        },
      },
      authorize(rawCredentials, request) {
        const rawEmail =
          typeof rawCredentials.email === "string"
            ? normalizeAdminEmail(rawCredentials.email)
            : "invalid-email";
        const ip = requesterIp(request.headers) ?? "unknown-ip";
        const emailKey = anonymizedRateLimitKey("admin-login-email", rawEmail);
        const pairKey = anonymizedRateLimitKey(
          "admin-login-email-ip",
          `${rawEmail}|${ip}`,
        );
        const ipKey = anonymizedRateLimitKey("admin-login-ip", ip);
        const blocked =
          !inspectRateLimit({
            key: emailKey,
            limit: LOGIN_FAILURE_LIMIT,
            windowMs: LOGIN_FAILURE_WINDOW_MS,
          }).allowed ||
          !inspectRateLimit({
            key: pairKey,
            limit: LOGIN_FAILURE_LIMIT,
            windowMs: LOGIN_FAILURE_WINDOW_MS,
          }).allowed ||
          !inspectRateLimit({
            key: ipKey,
            limit: LOGIN_IP_FAILURE_LIMIT,
            windowMs: LOGIN_FAILURE_WINDOW_MS,
          }).allowed;
        if (blocked) return null;

        const result = credentialsSchema.safeParse(rawCredentials);
        const email = result.success
          ? normalizeAdminEmail(result.data.email)
          : rawEmail;
        const authenticated =
          result.success &&
          isAdminAuthConfigured() &&
          isAllowedAdminEmail(email) &&
          verifyAdminPassword(result.data.password);

        if (!authenticated) {
          consumeRateLimit({
            key: emailKey,
            limit: LOGIN_FAILURE_LIMIT,
            windowMs: LOGIN_FAILURE_WINDOW_MS,
          });
          consumeRateLimit({
            key: pairKey,
            limit: LOGIN_FAILURE_LIMIT,
            windowMs: LOGIN_FAILURE_WINDOW_MS,
          });
          consumeRateLimit({
            key: ipKey,
            limit: LOGIN_IP_FAILURE_LIMIT,
            windowMs: LOGIN_FAILURE_WINDOW_MS,
          });
          return null;
        }

        clearRateLimit(emailKey);
        clearRateLimit(pairKey);
        clearRateLimit(ipKey);
        return {
          id: adminIdForEmail(email),
          email,
          name: "Administrator",
          isAdmin: true,
        };
      },
    }),
  ],
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    signIn({ user }) {
      return (
        isAdminAuthConfigured() &&
        isAllowedAdminEmail(user.email) &&
        user.isAdmin === true
      );
    },
    jwt({ token, user }) {
      const currentAuthVersion = adminAuthVersion();
      if (user) {
        token.sub = user.id;
        token.email = user.email ? normalizeAdminEmail(user.email) : undefined;
        token.adminAuthVersion = currentAuthVersion;
      }

      token.isAdmin =
        isAdminAuthConfigured() &&
        isAllowedAdminEmail(token.email) &&
        typeof token.adminAuthVersion === "string" &&
        token.adminAuthVersion === currentAuthVersion;
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? "",
          email: typeof token.email === "string" ? token.email : null,
          isAdmin:
            token.isAdmin === true &&
            isAllowedAdminEmail(token.email) &&
            typeof token.adminAuthVersion === "string" &&
            token.adminAuthVersion === adminAuthVersion(),
        },
      };
    },
  },
} satisfies NextAuthConfig;
