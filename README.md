# Gian Studio

Gian Studio is a T3/Next.js platform for a contemporary artist and tattoo
practice. It includes:

- an editorial portfolio driven by published gallery posts;
- **The Black Index**, an original first-person Canvas raycasting exhibition at
  `/doom/`;
- a private admin dashboard for gallery posts, products, orders, and bookings;
- server-priced Stripe Checkout with signed webhook handling and inventory
  reservation;
- tattoo, artwork, and collaboration appointment requests.

## Requirements

- [Bun](https://bun.sh/)
- PostgreSQL
- a Stripe account and the Stripe CLI for live checkout testing

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
| `STRIPE_WEBHOOK_SECRET`             | Signing secret for `/api/stripe/webhook`                           |
| `STRIPE_ALLOWED_SHIPPING_COUNTRIES` | Comma-separated shipping destinations; defaults to `DE`            |

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
origin. Development and test environments may use HTTP; checkout can fall back
to the request origin when the variable is unset.

## Stripe

Checkout prices and inventory are always read from PostgreSQL; the browser
cannot provide its own price. A pending order and inventory reservation are
created before redirecting to Stripe. Prices are stored and charged in euro
cents; the dashboard intentionally fixes the catalogue currency to EUR.

For local webhook testing:

```sh
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the reported signing secret into `STRIPE_WEBHOOK_SECRET`. The webhook
marks completed payments as paid and releases reserved inventory when a
Checkout Session expires or an asynchronous payment fails.

Checkout requires billing details, a phone number, and a shipping address for
the configured destination countries.

Monitor webhook delivery in Stripe. If an expiry event is ever missed, cancel
the stale `PENDING` order from `/admin/orders`; this expires any open Checkout
Session and releases its reserved inventory safely.

## Admin

Visit `/admin/login` and sign in with an email present in
`ALLOWED_ADMIN_MAILS` plus `ADMIN_PASSWORD`.

- `/admin/gallery` — create, edit, order, feature, publish, and delete work
- `/admin/products` — manage products, prices, stock, and visibility
- `/admin/orders` — inspect line items and update fulfilment status
- `/admin/bookings` — review client requests and update appointment status

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
