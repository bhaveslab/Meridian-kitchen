-- Seed data for Iyānu's Kitchen (Wholelistic Life Village).
-- Idempotent: re-running this script updates existing rows in place rather
-- than erroring or duplicating, so it's safe to re-run after edits here.
--
-- Prices are USD cents (the canonical, Stripe-charged amount) — see
-- db/schema.sql and README for why HNL is a converted display estimate only.
--
-- Spanish translations are intentionally left empty ('{}'). Machine-translating
-- a real menu's dish names and descriptions risks getting brand voice and
-- idiom wrong, so that content should come from the restaurant via the
-- dashboard's EN/ES fields, not be guessed here.
--
-- food_guide_tags are a provisional tagging against shared/foodGuide.ts —
-- confirm/correct these against the actual WLV Electric Foods Guide before
-- treating them as final; they were assigned from ingredient lists, not the
-- source guide itself.
--
-- Run against a Vercel Postgres database, e.g.:
--   psql "$POSTGRES_URL" -f db/seed.sql

INSERT INTO restaurants (id, slug, name, description, is_active, usd_hnl_exchange_rate)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'iyanus-kitchen',
  'Iyānu''s Kitchen',
  'Plant-based, alkaline/electric cuisine from Wholelistic Life Village.',
  true,
  26.5
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Mains & Savory', 10),
  ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Rolls', 20),
  ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Pastries', 30),
  ('a0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Smoothies & Juices', 40),
  ('a0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Chocolate', 50)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Mains & Savory
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Alkaline Machuca', 'Alkalized Garifuna dish: savory mushroom stew over pounded plantain.',
   1350, false, ARRAY['vegetables','fruits','oils'], 10),

  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Portabelo Empanadas', 'Spicy portobello walnut meat in a flaky crust, with a sweet-savory dip (3pc).',
   999, false, ARRAY['vegetables','nuts_and_seeds','grains','oils'], 20),

  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Pasta Supreme', 'Mushroom veggie medley over spelt or chickpea pasta.',
   999, false, ARRAY['vegetables','grains'], 30),

  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Chips and Guac', 'Batter-fried green bananas with fresh guacamole.',
   639, false, ARRAY['fruits','oils'], 40),

  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Electric Vergers', 'Garbanzo veggie burger sliders on ancient grain flatbread, with tomatillo or spicy hummus (2pc).',
   1260, false, ARRAY['vegetables','grains','oils'], 50),

  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Quinoa Stir Fry', 'Quinoa veggie medley, Chinese-fried-rice style, with tajadas and avocado.',
   1296, false, ARRAY['vegetables','grains','fruits','oils'], 60),

  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Garden Omelet', 'Chickpea-based omelet with sautéed garden veggies and mushrooms, served with green banana hash.',
   1099, true, ARRAY['vegetables','grains','fruits'], 70),

  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Mushroom Wrap', 'Grilled mushrooms, avocado, and tomato in a sweet-spicy house sauce, wrapped in an alkaline tortilla.',
   999, true, ARRAY['vegetables','fruits','grains'], 90),

  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Hot Veggie Wrap', 'Stir-fried tomato, onion, bell pepper, and mushroom in a warm spelt tortilla or nori roll.',
   999, true, ARRAY['vegetables','grains'], 100)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Electric Falafels: the one item with a serving_style variant (plate vs. wrap, same price).
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, food_guide_tags, variant_options, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Electric Falafels',
   'Garbanzo, mushroom, and whole grain kamut herbs, fried in coconut or avocado oil, with a garden salad and house dressing.',
   1099, true, ARRAY['vegetables','grains','oils','herbs_and_spices'],
   '[{"key":"serving_style","labelEn":"Serving style","labelEs":"Estilo de servicio","choices":[{"value":"plate","labelEn":"Salad plate","labelEs":"Plato de ensalada","priceDeltaCents":0},{"value":"wrap","labelEn":"Wrap","labelEs":"Envuelto","priceDeltaCents":0}]}]'::jsonb,
   80)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, food_guide_tags = EXCLUDED.food_guide_tags,
  variant_options = EXCLUDED.variant_options, sort_order = EXCLUDED.sort_order;

-- Rolls
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011',
   'Black Rice Sushi w/ Spicy Tahini Sauce',
   'Black rice, portabella, avocado, and nut cheese wrapped in nori, with a spicy tahini drizzle.',
   1399, true, ARRAY['grains','vegetables','fruits','nuts_and_seeds','oils'], 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Pastries
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012',
   'Blueberry Spelt Muffins', NULL, 499, true, ARRAY['grains','fruits','sweeteners'], 10),

  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012',
   'Spelt Strawberry Waffles', NULL, 899, true, ARRAY['grains','fruits','sweeteners'], 20),

  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012',
   'Hazelnut Butter Cookies', NULL, 399, true, ARRAY['grains','nuts_and_seeds','sweeteners'], 30)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Smoothies & Juices
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000013',
   'Green Thing (Smoothie)', 'Kale, watercress, dandelion greens, apple, key lime, and walnuts.',
   699, true, ARRAY['vegetables','fruits','nuts_and_seeds'], 10),

  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000013',
   'Berry Breeze (Smoothie)', 'Strawberry, blueberry, raspberry, banana, avocado, maca, and spirulina.',
   799, true, ARRAY['fruits','vegetables','herbs_and_spices'], 20),

  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000013',
   'Seamoss Shake', 'Seamoss, dates, coconut, vanilla, and nut milk.',
   899, true, ARRAY['fruits','nuts_and_seeds','sweeteners'], 30)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Chocolate: rotating sub-catalog, not fixed products — seeded as a single
-- placeholder rather than guessed-at variants. Split into real items once
-- the actual current selection is known.
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000014',
   'Artisan Chocolate — ask about today''s selection',
   'Handmade truffles and dark/white chocolate bars, organic ingredients, sweetened with honey, coconut sugar, or maple. Infused and un-infused options available.',
   0, true, ARRAY['sweeteners'], 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;
