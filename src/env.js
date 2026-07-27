import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const siteUrlSchema = z
  .string()
  .url()
  .superRefine((value, context) => {
    let url;
    try {
      url = new URL(value);
    } catch {
      return;
    }
    const hostname = url.hostname
      .trim()
      .toLowerCase()
      .replace(/^\[|\]$/g, "");
    const localHostname =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "::1" ||
      hostname === "0:0:0:0:0:0:0:1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("127.");

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Use an HTTP(S) origin without credentials, a path, a query, or a fragment",
      });
    }

    if (
      process.env.NODE_ENV === "production" &&
      (url.protocol !== "https:" || localHostname)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "NEXT_PUBLIC_SITE_URL must be a non-local HTTPS origin in production",
      });
    }
  });

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET: z.string().min(32).optional(),
    ALLOWED_ADMIN_MAILS: z.string().optional(),
    ADMIN_PASSWORD: z.string().min(16).optional(),
    DATABASE_URL: z.string().url(),
    R2_S3_ENDPOINT: z.string().url().optional(),
    R2_BUCKET_NAME: z.string().trim().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_PUBLIC_BASE_URL: z.string().url().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_ALLOWED_SHIPPING_COUNTRIES: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NODE_ENV === "production"
        ? siteUrlSchema
        : siteUrlSchema.optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    ALLOWED_ADMIN_MAILS: process.env.ALLOWED_ADMIN_MAILS,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_ALLOWED_SHIPPING_COUNTRIES:
      process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
