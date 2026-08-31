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
- `DASHBOARD_PASSWORD`, the shared staff password for `/dashboard/:slug`.
  There is no default — until it's set, `getPassword()` (`api/_auth.ts`)
  throws and every dashboard login attempt fails.

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
  Guide categories (`shared/foodGuide.ts`, 10 categories including
  `sea_vegetables`). The seeded tags reflect the restaurant's own review
  pass, not a guess — see "Iyānu's Kitchen — Spanish Translations &
  Food-Guide Tags" for the source draft.
- **`variant_options`**: optional modifier groups on an item (e.g. Electric
  Falafels' plate-vs-wrap `serving_style`), stored as JSON on the item and
  edited via a raw JSON field in the dashboard's item editor. Selected
  choices and any price delta are snapshotted onto the order at checkout.
- **Bilingual (EN/ES)**: static UI chrome text lives in `shared/i18n.ts`.
  Menu content (item/category names & descriptions) is translated per-row
  via a `translations` JSONB column, editable from the dashboard. Item
  translations are seeded from the restaurant's reviewed draft; category
  headers (Mains & Savory, Rolls, etc.) got straightforward direct
  translations since they're generic section names, not brand content.
- **Currency**: `price_cents` is USD cents and is always the amount actually
  charged. HNL is shown alongside as a converted *estimate* only
  (`restaurants.usd_hnl_exchange_rate`, dashboard-editable, no live FX feed
  in v1). `orders.exchange_rate_hnl_per_usd` snapshots the rate shown at
  checkout time so a later rate change doesn't retroactively alter what a
  past order's HNL estimate was.
- **Shipping**: `restaurants.shipping_fee_domestic_cents` /
  `shipping_fee_intl_cents` are `NULL` by default — a restaurant only
  charges shipping if both are set (e.g. General Store, which ships
  physical goods; Kitchen's local pickup/delivery never sets these). When
  set and `fulfillmentType` is `"delivery"`, checkout requires a
  `shippingZone` (`"domestic"` | `"international"`) on `CheckoutInput` and
  adds the matching flat fee as a Stripe line item — once per order, not
  per item. It's not stored as an `order_items` row since it isn't a menu
  item.
- **External storefronts**: `restaurants.external_storefront_url` is
  `NULL` for any restaurant using this app's own `/r/:slug/...` guest
  flow. When set (General Store's `generalstore.html`, hosted on
  SiteGround, outside this app), `checkout.ts` redirects Stripe's
  success/cancel back to that URL (`?checkout=success` /
  `?checkout=cancelled`) instead of an in-app route that wouldn't exist
  there — otherwise a successful payment lands the guest on a 404 even
  though the order and charge went through correctly.

## Known v1 gaps (by design)

- `/dashboard/:slug` is gated by one shared password (`DASHBOARD_PASSWORD`),
  not per-user accounts — no individual identity, no audit trail of who
  advanced or cancelled which order, and one password rotation locks out
  every staff member at once. Fine for a single small-staff restaurant;
  revisit with real accounts if that changes (`api/_auth.ts`).
- No restaurant-onboarding UI — `restaurants` supports many tenants, but v1
  seeds one via SQL rather than building admin CRUD for creating them.
- No guest accounts — checkout captures contact info per order.
- Cancelling a paid order does not trigger an automatic Stripe refund; that
  stays a manual step in the Stripe dashboard.
- Exchange rate is manually maintained, not pulled from a live FX API.
