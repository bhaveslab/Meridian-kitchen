# Meridian Kitchen

Guest-facing, DoorDash-style ordering for **Iyānu's Kitchen** (Wholelistic Life
Village) — the restaurant owns its own menu and customer data, no
marketplace, no commission fees, no data lock-in.

Guests browse a restaurant's public storefront, build a cart, and check out
directly through Stripe. Restaurant staff manage the menu and incoming
orders from a dashboard. The schema is multi-tenant (a `restaurants` table)
even though v1 launches with a single restaurant.

## ⚠️ Before this can take real orders

**`STRIPE_SECRET_KEY` must be swapped from a test/placeholder key to the
restaurant's own key before going live.** This is Iyānu's Kitchen's own
Stripe account, charging in **USD** — not a Meridian-owned account, and not
HNL. The code has no currency-type branching to worry about; swapping the
key is a pure config change (env var), never a code change. Until a real key
is set, `getStripe()` (`api/_stripe.ts`) throws rather than silently using a
fake one.

Also required before launch:
- A Vercel Postgres database, with `db/schema.sql` applied and `db/seed.sql`
  loaded (see below).
- `STRIPE_WEBHOOK_SECRET`, from a webhook endpoint pointed at
  `/api/webhooks/stripe`, subscribed to `checkout.session.completed` and
  `checkout.session.expired`.

## Stack

- Vite + React + TypeScript frontend
- Node serverless functions under `/api` (Vercel, Node 24.x)
- Vercel Postgres for persistence
- Stripe Checkout for payment (USD, the restaurant's own account)
- 3–5s polling for live order status — no WebSockets in v1

## Setup

```bash
npm install
cp .env.example .env.local   # fill in POSTGRES_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
psql "$POSTGRES_URL" -f db/schema.sql
psql "$POSTGRES_URL" -f db/seed.sql   # loads the real Iyānu's Kitchen menu
npm run dev
```

`db/seed.sql` is idempotent — re-running it after editing updates existing
rows in place rather than duplicating them.

## Routes

- `/r/:slug` — public storefront: browse → cart → checkout → redirect to
  Stripe → back to `/r/:slug/order/:orderId` for live status
- `/dashboard/:slug` — restaurant dashboard: incoming paid orders (status
  advance `received → preparing → ready → [out_for_delivery] → completed`)
  and menu management (categories/items, pricing, availability)

## Menu data model notes

- **`needs_pricing`**: a menu item can carry a real (placeholder) price and
  still be flagged as needing a final number. The dashboard surfaces these
  with a badge so they don't get lost.
- **`food_guide_tags`**: each item is tagged against the WLV Electric Foods
  Guide categories (`shared/foodGuide.ts`). The seeded tags are provisional —
  assigned from ingredient lists, not the source guide — and should be
  confirmed against the actual guide.
- **`variant_options`**: optional modifier groups on an item (e.g. Electric
  Falafels' plate-vs-wrap `serving_style`), stored as JSON on the item and
  edited via a raw JSON field in the dashboard's item editor. Selected
  choices and any price delta are snapshotted onto the order at checkout.
- **Bilingual (EN/ES)**: static UI chrome text lives in `shared/i18n.ts`.
  Menu content (item/category names & descriptions) is translated per-row
  via a `translations` JSONB column, editable from the dashboard. **The
  seeded Spanish translations are empty** — machine-translating a real menu
  risked getting brand voice wrong, so that content should be filled in by
  the restaurant, not guessed by the seed script.
- **Currency**: `price_cents` is USD cents and is always the amount actually
  charged. HNL is shown alongside as a converted *estimate* only
  (`restaurants.usd_hnl_exchange_rate`, dashboard-editable, no live FX feed
  in v1). `orders.exchange_rate_hnl_per_usd` snapshots the rate shown at
  checkout time so a later rate change doesn't retroactively alter what a
  past order's HNL estimate was.

## Known v1 gaps (by design)

- No auth on `/dashboard/:slug` — anyone with the link can manage the menu
  and orders. Flagged as a gap to close before real use.
- No restaurant-onboarding UI — `restaurants` supports many tenants, but v1
  seeds one via SQL rather than building admin CRUD for creating them.
- No guest accounts — checkout captures contact info per order.
- Cancelling a paid order does not trigger an automatic Stripe refund; that
  stays a manual step in the Stripe dashboard.
- Exchange rate is manually maintained, not pulled from a live FX API.
