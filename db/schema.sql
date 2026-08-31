-- Meridian Kitchen schema
-- Guest-facing, multi-tenant restaurant ordering: menu architecture, direct
-- guest checkout with payment, and a restaurant-owner order/menu dashboard.
-- Run against a Vercel Postgres database, e.g.:
--   psql "$POSTGRES_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'received', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_type AS ENUM ('pickup', 'delivery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tenant layer: every restaurant on the platform owns its own menu and
-- orders. Launching with one restaurant does not mean this table has one row
-- forever, so nothing downstream may assume a single implicit tenant.
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Display-only estimate for showing HNL alongside the real USD charge.
  -- Manually maintained in v1 (no live FX feed), editable from the dashboard.
  usd_hnl_exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 26.5,
  -- Flat, once-per-order shipping fee in USD cents. NULL means this
  -- restaurant doesn't charge shipping (e.g. Iyānu's Kitchen, local
  -- pickup/delivery only) — checkout.ts only requires/charges a shipping
  -- fee when one of these is set, so this stays opt-in per restaurant.
  shipping_fee_domestic_cents INTEGER,
  shipping_fee_intl_cents INTEGER,
  -- Set only for restaurants whose guest-facing storefront lives outside
  -- this app (e.g. General Store's generalstore.html on SiteGround).
  -- When set, checkout.ts redirects Stripe's success/cancel back to this
  -- URL instead of assuming the in-app /r/:slug/... route exists — that
  -- route doesn't exist on an external static site. NULL for Kitchen and
  -- any future in-app restaurant, which keep using /r/:slug/... as-is.
  external_storefront_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- {"es": {"name": "..."}} — "name" above stays the English default/fallback.
  translations JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- {"es": {"name": "...", "description": "..."}} — English columns above are the fallback.
  translations JSONB NOT NULL DEFAULT '{}',
  -- Path/URL to a photo, e.g. "/menu-photos/alkaline-machuca.jpg". Null means
  -- no photo yet — the UI falls back to a placeholder state, not a guess.
  image_url TEXT,
  -- Canonical price is USD cents — this is what Stripe actually charges.
  -- HNL is a converted display estimate only, never the source of truth.
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  -- True while the listed price is a placeholder pending a real number,
  -- so the dashboard can surface it as needing attention.
  needs_pricing BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Tags into the WLV Electric Foods Guide categories (see shared/foodGuide.ts).
  food_guide_tags TEXT[] NOT NULL DEFAULT '{}',
  -- Optional modifier groups, e.g. serving_style (plate/wrap). Empty array
  -- means the item has no choices to make. Price deltas are USD cents.
  -- [{ "key": "serving_style", "labelEn": "...", "labelEs": "...",
  --    "choices": [{ "value": "plate", "labelEn": "...", "labelEs": "...", "priceDeltaCents": 0 }] }]
  variant_options JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  fulfillment_type fulfillment_type NOT NULL,
  delivery_address TEXT,
  status order_status NOT NULL DEFAULT 'received',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  -- Snapshot of the restaurant's usd_hnl_exchange_rate at checkout time, so a
  -- later rate change doesn't retroactively alter what a past order's HNL
  -- estimate was shown as.
  exchange_rate_hnl_per_usd NUMERIC(10, 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT delivery_address_required CHECK (
    fulfillment_type = 'pickup' OR delivery_address IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  -- USD cents, already inclusive of any variant price delta at order time.
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  -- {"serving_style": "wrap"} — echoes menu_items.variant_options choices made.
  selected_variants JSONB NOT NULL DEFAULT '{}',
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
