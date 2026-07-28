# Gian Studio

Gian Studio is a T3/Next.js platform for a contemporary artist and tattoo
practice. It includes:

- an editorial portfolio driven by published gallery posts;
- **The Black Index**, an original first-person Canvas raycasting exhibition at
  `/doom/`;
- a private admin dashboard for gallery posts, products, orders, and bookings;
- server-priced Stripe Checkout with return-time server verification and
  inventory reservation;
- tattoo, artwork, and collaboration appointment requests.

## Requirements

- [Bun](https://bun.sh/)
- PostgreSQL
- a Stripe account
- a Cloudflare R2 bucket for dashboard media uploads

## Local setup

Install dependencies, copy the environment template, and initialize the
database:

```sh
bun install
cp .env.example .env
bun run db:migrate
bun run db:seed
bun run dev
```

The site is available at `http://localhost:3000`. Seed data adds the three
bundled original artworks and three purchasable studio editions.

## Environment

| Variable                            | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                      | PostgreSQL connection string                                       |
| `AUTH_SECRET`                       | Auth.js signing secret; generate with `bunx auth secret`           |
| `ALLOWED_ADMIN_MAILS`               | Comma-, semicolon-, or whitespace-separated admin email allowlist  |
| `ADMIN_PASSWORD`                    | Shared admin password (minimum 16 characters); keep it server-side |
| `NEXT_PUBLIC_SITE_URL`              | Trusted canonical origin for metadata and Stripe redirects         |
| `STRIPE_SECRET_KEY`                 | Stripe secret API key used only on the server                      |
| `STRIPE_ALLOWED_SHIPPING_COUNTRIES` | Comma-separated shipping destinations; defaults to `DE`            |
| `R2_S3_ENDPOINT`                    | Account-scoped R2 S3 endpoint containing the Cloudflare Account ID |
| `R2_BUCKET_NAME`                    | Bucket used for admin media                                        |
| `R2_ACCESS_KEY_ID`                  | Server-only R2 API-token access key                                |
| `R2_SECRET_ACCESS_KEY`              | Server-only R2 API-token secret key                                |
| `R2_PUBLIC_BASE_URL`                | Public custom-domain origin used to build permanent media URLs     |

Admin authentication is deliberately disabled if `AUTH_SECRET`,
`ALLOWED_ADMIN_MAILS`, or `ADMIN_PASSWORD` is missing. Email matching is
case-insensitive. The allowlist is checked when credentials are submitted,
whenever the JWT is refreshed, and again at the admin API boundary, so removing
an address revokes its access.

Login, checkout, and booking endpoints include process-local abuse throttles.
IP-based throttling is best-effort and depends on the deployment proxy setting
`CF-Connecting-IP`, `X-Real-IP`, or `X-Forwarded-For` correctly; database-backed
per-email reservation limits remain the durable checkout and booking guard.
Auth.js also trusts the proxy-provided host, so the proxy must replace
untrusted `Host`/`X-Forwarded-Host` values with the public application host.
Production builds require `NEXT_PUBLIC_SITE_URL` to use a non-local HTTPS
origin. Development and test environments may use HTTP; checkout falls back to
`http://localhost:$PORT` when the variable is unset.

## Public language and legal details

The public visitor experience and private administration interface are written
in German. Before publishing, replace every placeholder in
`src/app/_lib/legal.ts` with the provider's real legal name, service address,
email address, and phone number. Add register or VAT details to
`src/app/impressum/page.tsx` if they apply to the business.

## Stripe

`checkout.createSession` validates the browser input in a public tRPC procedure,
reads prices and inventory from PostgreSQL, reserves stock, and creates the
Stripe-hosted Checkout Session. The browser can submit only an email address,
product IDs, and quantities; it cannot provide prices, totals, currency, or
redirect URLs. Prices are stored and charged in euro cents, and the dashboard
intentionally fixes the catalogue currency to EUR.

After Stripe redirects to the success page, the server calls the
`checkout.confirmSession` tRPC procedure. It retrieves the session and expanded
PaymentIntent directly from Stripe, then verifies the application and order
metadata, order reference, email, amount, currency, and succeeded payment
status before marking the order paid. No payment state from the browser is
trusted.

This integration intentionally does not expose a Stripe webhook endpoint.
Checkout is restricted to immediate card payments, including card-backed
wallets, because delayed payment methods need asynchronous notification.
Checkout also requires billing details, a phone number, and a shipping address
for the configured destination countries.

Without webhooks, an order is confirmed only when its Stripe success URL is
loaded. If a customer closes the tab before the redirect, inspect the stale
`PENDING` order in Stripe before acting on it. Cancelling it from
`/admin/orders` retrieves the Checkout Session server-side, refuses to cancel a
paid session, and otherwise expires the session and safely releases inventory.

## Admin

Visit `/admin/login` and sign in with an email present in
`ALLOWED_ADMIN_MAILS` plus `ADMIN_PASSWORD`.

- `/admin/gallery` — create, edit, order, feature, publish, and delete work
- `/admin/media` — upload, browse, copy, and delete images stored in R2
- `/admin/products` — manage products, prices, stock, and visibility
- `/admin/orders` — inspect line items and update fulfilment status
- `/admin/bookings` — review client requests and update appointment status

## Cloudflare R2 media

[Create an R2 API token](https://developers.cloudflare.com/r2/api/tokens/) with
**Object Read & Write** permission restricted to the single media bucket. Put
the token's access key ID and secret access key in the server environment; they
must never be exposed through a `NEXT_PUBLIC_` variable. `R2_S3_ENDPOINT` is the
account-scoped S3 endpoint shown by Cloudflare, normally
`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

[Attach a public custom domain](https://developers.cloudflare.com/r2/buckets/public-buckets/)
to the bucket and use its HTTPS origin for `R2_PUBLIC_BASE_URL`, for example
`https://media.example.com`. Cloudflare's `r2.dev` public URL is suitable only
for development and must not be used for production delivery.

The browser uploads directly to short-lived presigned PUT URLs. Configure the
bucket's [CORS policy](https://developers.cloudflare.com/r2/buckets/cors/) with
the exact deployed application origin and the local development origin. Replace
`https://studio.example.com` below with the origin used by
`NEXT_PUBLIC_SITE_URL`; do not use a wildcard:

```json
[
  {
    "AllowedOrigins": ["https://studio.example.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "Cache-Control"],
    "MaxAgeSeconds": 3600
  }
]
```

All five R2 variables are required together for media management. If the R2
configuration is absent or incomplete, the rest of the application continues
to work and the Media page reports the configuration problem.

## The Black Index

The game source lives directly in `public/doom/`, so it ships with Gian Studio
as part of the same build and deployment. Edit `index.html`, `style.css`,
`game.js`, or the files in `public/doom/assets/` in place; no separate project
or sync step is required.

When served by Gian Studio, the game reads published artwork from
`GET /api/gallery`. It falls back to its bundled exhibition when the API or
database is unavailable.

## Verification

```sh
bun test
bun run typecheck
bun run lint
bun run format:check
bunx prisma validate
NEXT_PUBLIC_SITE_URL=https://your-production-origin.example bun run build
```

The included migration is a from-empty PostgreSQL migration. Run
`bun run db:migrate` for every production release. Run `bun run db:seed` only
when initializing a new database; the seed is create-only and will not reset
dashboard edits or sold inventory when repeated.
