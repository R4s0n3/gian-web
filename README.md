# Gian Studio

Gian Studio is a T3/Next.js platform for a contemporary artist and tattoo
practice. It includes:

- an editorial portfolio driven by published gallery posts;
- a downloadable portfolio PDF managed through the admin dashboard;
- a private admin dashboard for gallery posts, products, orders, and bookings;
- PostHog website analytics and Web Vitals in the admin overview;
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

| Variable                            | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`                      | PostgreSQL connection string                                            |
| `AUTH_SECRET`                       | Auth.js signing secret; generate with `bunx auth secret`                |
| `ALLOWED_ADMIN_MAILS`               | Comma-, semicolon-, or whitespace-separated admin email allowlist       |
| `ADMIN_PASSWORD`                    | Shared admin password (minimum 16 characters); keep it server-side      |
| `NEXT_PUBLIC_SITE_URL`              | Trusted canonical origin for metadata and Stripe redirects              |
| `NEXT_PUBLIC_POSTHOG_KEY`           | Public PostHog project token for browser analytics                      |
| `NEXT_PUBLIC_POSTHOG_HOST`          | PostHog ingestion origin (`https://eu.i.posthog.com` or US equivalent)  |
| `POSTHOG_PROJECT_ID`                | Numeric PostHog project ID                                              |
| `POSTHOG_PERSONAL_API_KEY`          | Server-only personal API key with project-restricted `query:read` scope |
| `POSTHOG_API_HOST`                  | Private PostHog API origin (`https://eu.posthog.com` or US equivalent)  |
| `STRIPE_SECRET_KEY`                 | Stripe secret API key used only on the server                           |
| `STRIPE_ALLOWED_SHIPPING_COUNTRIES` | Comma-separated shipping destinations; defaults to `DE`                 |
| `R2_S3_ENDPOINT`                    | Account-scoped R2 S3 endpoint containing the Cloudflare Account ID      |
| `R2_BUCKET_NAME`                    | Bucket used for admin media                                             |
| `R2_ACCESS_KEY_ID`                  | Server-only R2 API-token access key                                     |
| `R2_SECRET_ACCESS_KEY`              | Server-only R2 API-token secret key                                     |
| `R2_PUBLIC_BASE_URL`                | Public custom-domain origin used to build permanent media URLs          |

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

- `/admin` — studio overview, website traffic, acquisition, and Web Vitals
- `/admin/gallery` — create, edit, order, feature, publish, and delete work
- `/admin/media` — upload, browse, copy, and delete images stored in R2
- `/admin/website` — manage the hero carousel and upload or replace the portfolio PDF
- `/admin/products` — manage products, prices, stock, and visibility
- `/admin/orders` — inspect line items and update fulfilment status
- `/admin/bookings` — review client requests and update appointment status

## PostHog analytics

Create a PostHog project and copy its public project token and numeric project
ID from **Project settings**. Create a **personal API key** with `query:read`
scope, restricted to this project. The project token is for browser ingestion;
the personal API key is for reading the dashboard and stays on the server.
See [PostHog API authentication](https://posthog.com/docs/api) and
[query API permissions](https://posthog.com/docs/api/query).

Configure the five PostHog variables in `.env.example` and set
`NEXT_PUBLIC_SITE_URL` to the public website's exact origin. Use the same region
for both hosts: EU uses `https://eu.i.posthog.com` for ingestion and
`https://eu.posthog.com` for queries; US uses `https://us.i.posthog.com` and
`https://us.posthog.com`. Self-hosted HTTP(S) origins are also supported.
Rebuild after changing `NEXT_PUBLIC_*` values, because Next.js embeds them in
the browser bundle. No database migration is needed for analytics.

The overview at `/admin` shows 7, 30, or 90 calendar days including the current
day: anonymous visitors, pageviews, sessions, bounce rate, average session
duration, daily traffic, top pages, referrers/UTM sources, UTM campaigns,
countries, devices, and p75 LCP/INP/CLS/FCP. Days use UTC. Sessions and sources
are attributed to their entry time; pageview metrics use event time. A session
crossing the period boundary can therefore have pageviews in a different period.
Country data uses PostHog GeoIP enrichment; disablement or blocked tracking
can leave locations unknown. Use `utm_source`, `utm_medium`, and `utm_campaign`
on campaign links for useful acquisition data.

Bounce rate uses [PostHog's native session definition](https://posthog.com/docs/web-analytics/dashboard):
one pageview, no autocaptured interactions, and less than 10 seconds. Click
autocapture and pageleave events are enabled for this purpose. Web Vitals use
the [SDK's performance capture](https://posthog.com/docs/web-analytics/web-vitals);
missing measurements display as unavailable, and INP needs a visitor interaction.

Tracking loads lazily on public routes and only on the canonical origin, so
preview URLs and local development do not pollute production data. To test
ingestion locally, explicitly set the canonical origin to the localhost origin
and use a separate PostHog test project. Admin and API routes are excluded.
Tracking is anonymous, honors Do Not Track, masks autocaptured text/attributes,
and disables session replay, person profiles, surveys, and feature flags.
PostHog uses its standard first-party browser persistence for anonymous IDs and
sessions. URL fragments and query parameters other than `utm_*` campaign
parameters are removed from captured URLs, including nested Web Vital payloads.

The dashboard uses the existing administrator allowlist on every request. It
executes fixed, bounded HogQL queries on the server, with 20-second request
timeouts and a five-minute process-local cache for each period. Concurrent
requests share the same query work. Failed queries are not cached or shown as
zero traffic. If any variable is missing, the overview displays an unconfigured
state; the rest of the application continues to work. Data appears only after
visits have been captured and processed by PostHog.

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

## Portfolio download

Upload the portfolio under **Admin → Website → Portfolio-PDF**. PDFs can be up
to 30 MiB. The browser uploads to the existing R2 bucket using its current PUT
CORS policy; the server checks the uploaded file before publishing the download.
Only the published PDF is linked on the homepage. Replacing or removing it does
not change the hero carousel. Previous files remain in R2.

`GET /portfolio/download` streams the current PDF as an attachment, so the button
downloads the file directly. Until a PDF is published, the homepage displays a
preparation message and disables the download button.

Run `bun run db:migrate` before deploying this change to add the portfolio fields
to `SiteSettings`.

## Verification

```sh
bun test
bun run typecheck
bun run lint
bun run format:check
bunx prisma validate
NEXT_PUBLIC_SITE_URL=https://your-production-origin.example bun run build
```

The migration history includes the initial PostgreSQL schema. Run
`bun run db:migrate` for every production release. Run `bun run db:seed` only
when initializing a new database; the seed is create-only and will not reset
dashboard edits or sold inventory when repeated.

### Existing databases without migration history (P3005)

If the database was initialized with `prisma db push`, Prisma Migrate may report
`P3005: The database schema is not empty`. `bun run db:migrate` now handles this
case by checking the existing pre-PDF schema, recording its baseline, and
retrying the deployment. The deployment command remains:

```sh
bun run db:migrate
```

To run the baseline step separately (including resuming a partially recorded
baseline), use:

```sh
bun run db:baseline
bun run db:migrate
```

The baseline command first compares the database with the frozen
`prisma/baseline.prisma` schema. Only an exact match allows it to record the
initial, commission-category, and hero-carousel migrations as already applied.
It preserves existing tables and rows and leaves the PDF migration pending.
If the schema differs or a migration has failed, it stops for inspection. A
database that already has these baseline records requires no changes.

Baseline checks use Prisma's migration CLI and schema engine, without loading
the application's native query library. `nixpacks.toml` adds OpenSSL to the
runtime library path for the application's Prisma Client. Rebuild the image
after changing this configuration; restarting an older image will not add it.

For a new, empty database, use `bun run db:migrate` directly. Do not reset or
reseed an existing production database to fix P3005.
