-- Seed data for Iyānu's Kitchen (Wholelistic Life Village).
-- Idempotent: re-running this script updates existing rows in place rather
-- than erroring or duplicating, so it's safe to re-run after edits here.
--
-- Prices are USD cents (the canonical, Stripe-charged amount) — see
-- db/schema.sql and README for why HNL is a converted display estimate only.
--
-- Spanish item translations and food_guide_tags below come from the
-- restaurant's own review draft, not a machine translation — see the
-- "Iyānu's Kitchen — Spanish Translations & Food-Guide Tags" doc. Category
-- headers (Mains & Savory, Rolls, etc.) are translated here directly since
-- they're generic culinary section names, not brand-specific content the
-- restaurant needed to review.
--
-- One tag deviates from the restaurant's draft: Seamoss Shake is tagged
-- `sea_vegetables` (added to shared/foodGuide.ts) instead of the `vegetables`
-- stand-in the draft used, per its own flag that seamoss is a distinct WLV
-- guide category.
--
-- image_url points at /menu-photos/<name>.jpg (public/menu-photos, real
-- supplied photography). All 18 items now have a photo. Artisan Chocolate's
-- photo is one representative shot of its rotating, unphotographed-as-a-
-- whole sub-catalog, not a fixed product photo. The storefront should still
-- render a placeholder state for a NULL image_url in general, since this
-- isn't schema-enforced.
--
-- Run against a Vercel Postgres database, e.g.:
--   psql "$POSTGRES_URL" -f db/seed.sql

INSERT INTO restaurants (id, slug, name, description, phone, is_active, usd_hnl_exchange_rate)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'iyanus-kitchen',
  'Iyānu''s Kitchen',
  'Plant-based, alkaline/electric cuisine from Wholelistic Life Village.',
  '+504 3239-9269',
  true,
  26.5
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;

INSERT INTO menu_categories (id, restaurant_id, name, translations, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Mains & Savory',
   '{"es":{"name":"Platos Principales"}}'::jsonb, 10),
  ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Rolls',
   '{"es":{"name":"Rollos"}}'::jsonb, 20),
  ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Pastries',
   '{"es":{"name":"Pastelería"}}'::jsonb, 30),
  ('a0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Smoothies & Juices',
   '{"es":{"name":"Batidos y Jugos"}}'::jsonb, 40),
  ('a0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Chocolate',
   '{}'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, translations = EXCLUDED.translations, sort_order = EXCLUDED.sort_order;

-- Mains & Savory
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, translations, image_url, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Alkaline Machuca', 'Alkalized Garifuna dish: savory mushroom stew over pounded plantain.',
   '{"es":{"name":"Machuca Alcalino","description":"Una versión alcalina del tradicional plato cultural garífuna, hecho de un guiso sabroso de hongos servido sobre plátano machacado."}}'::jsonb,
   '/menu-photos/alkaline-machuca.jpg', 1350, false, ARRAY['vegetables','oils'], 10),

  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Portabelo Empanadas', 'Spicy portobello walnut meat in a flaky crust, with a sweet-savory dip (3pc).',
   '{"es":{"name":"Empanadas de Portobello","description":"Deliciosa mezcla de carne de portobello y nuez picante envuelta en una masa crujiente y hojaldrada, con salsa dulce y salada para acompañar (3 piezas)."}}'::jsonb,
   '/menu-photos/portabelo-empanadas.jpg', 999, false, ARRAY['vegetables','nuts_and_seeds','grains','oils'], 20),

  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Pasta Supreme', 'Mushroom veggie medley over spelt or chickpea pasta.',
   '{"es":{"name":"Pasta Suprema","description":"Una mezcla bien sazonada de hongos y vegetales sobre pasta de espelta o garbanzo."}}'::jsonb,
   '/menu-photos/pasta-supreme.jpg', 999, false, ARRAY['vegetables','grains'], 30),

  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Chips and Guac', 'Batter-fried green bananas with fresh guacamole.',
   '{"es":{"name":"Tajadas y Guacamole","description":"Plátanos verdes fritos en masa con guacamole fresco. Un bocadillo simple pero satisfactorio como comida."}}'::jsonb,
   '/menu-photos/chips-guac.jpg', 639, false, ARRAY['vegetables','oils'], 40),

  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Electric Vergers', 'Garbanzo veggie burger sliders on ancient grain flatbread, with tomatillo or spicy hummus (2pc).',
   '{"es":{"name":"Vergers Eléctricos","description":"Sliders de hamburguesa vegetal a base de garbanzo servidos en pan plano de granos ancestrales, con salsa de tomatillo o hummus picante a elegir (2 piezas)."}}'::jsonb,
   '/menu-photos/electric-vergers.jpg', 1260, false, ARRAY['vegetables','grains'], 50),

  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Quinoa Stir Fry', 'Quinoa veggie medley, Chinese-fried-rice style, with tajadas and avocado.',
   '{"es":{"name":"Salteado de Quinoa","description":"Un delicioso salteado de quinoa y vegetales, preparado al estilo de arroz frito, con tajadas y aguacate."}}'::jsonb,
   '/menu-photos/quinoa-stir.jpg', 1296, false, ARRAY['vegetables','grains'], 60),

  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Garden Omelet', 'Chickpea-based omelet with sautéed garden veggies and mushrooms, served with green banana hash.',
   '{"es":{"name":"Omelet del Jardín","description":"Omelet a base de garbanzo con vegetales frescos del jardín y hongos salteados, servido con un hash de plátano verde."}}'::jsonb,
   '/menu-photos/garden-omelet.jpg', 1099, true, ARRAY['vegetables','grains'], 70),

  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Mushroom Wrap', 'Grilled mushrooms, avocado, and tomato in a sweet-spicy house sauce, wrapped in an alkaline tortilla.',
   '{"es":{"name":"Wrap de Hongos","description":"Suculentos hongos asados a la perfección envueltos en una tortilla alcalina con aguacate en rodajas y tomates dulces, bañados o acompañados con una salsa dulce y picante de la casa."}}'::jsonb,
   '/menu-photos/mushroom-wrap.jpg', 999, true, ARRAY['vegetables','oils'], 90),

  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Hot Veggie Wrap', 'Stir-fried tomato, onion, bell pepper, and mushroom in a warm spelt tortilla or nori roll.',
   '{"es":{"name":"Wrap Vegetal Caliente","description":"Tomate, cebolla, pimiento y hongos salteados, envueltos en una tortilla de espelta tibia o en un rollo de nori."}}'::jsonb,
   '/menu-photos/hot-veggie-wrap.jpg', 999, true, ARRAY['vegetables','grains'], 100)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, translations = EXCLUDED.translations,
  image_url = EXCLUDED.image_url, price_cents = EXCLUDED.price_cents, needs_pricing = EXCLUDED.needs_pricing,
  food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Electric Falafels: the one item with a serving_style variant (plate vs. wrap, same price).
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, translations, image_url, price_cents, needs_pricing, food_guide_tags, variant_options, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010',
   'Electric Falafels',
   'Garbanzo, mushroom, and whole grain kamut herbs, fried in coconut or avocado oil, with a garden salad and house dressing.',
   '{"es":{"name":"Falafeles Eléctricos","description":"Una mezcla picante de garbanzo, hongos, kamut integral y una deliciosa variedad de hierbas y especias frescas, fritos en aceite de coco o aguacate y servidos con ensalada fresca del jardín cubierta con el aderezo de la casa. (También disponible en wrap)"}}'::jsonb,
   '/menu-photos/electric-falafels.jpg', 1099, true, ARRAY['vegetables','grains','oils','herbs_and_spices'],
   '[{"key":"serving_style","labelEn":"Serving style","labelEs":"Estilo de servicio","choices":[{"value":"plate","labelEn":"Salad plate","labelEs":"Plato","priceDeltaCents":0},{"value":"wrap","labelEn":"Wrap","labelEs":"Wrap","priceDeltaCents":0}]}]'::jsonb,
   80)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, translations = EXCLUDED.translations,
  image_url = EXCLUDED.image_url, price_cents = EXCLUDED.price_cents, needs_pricing = EXCLUDED.needs_pricing,
  food_guide_tags = EXCLUDED.food_guide_tags, variant_options = EXCLUDED.variant_options, sort_order = EXCLUDED.sort_order;

-- Rolls
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, translations, image_url, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011',
   'Black Rice Sushi w/ Spicy Tahini Sauce',
   'Black rice, portabella, avocado, and nut cheese wrapped in nori, with a spicy tahini drizzle.',
   '{"es":{"name":"Sushi de Arroz Negro con Salsa Picante de Tahini","description":"Arroz negro, portobello, aguacate, queso de nuez y nori, con un toque de salsa picante de tahini."}}'::jsonb,
   '/menu-photos/black-rice-sushi.jpg', 1399, true, ARRAY['vegetables','grains','nuts_and_seeds','oils'], 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, translations = EXCLUDED.translations,
  image_url = EXCLUDED.image_url, price_cents = EXCLUDED.price_cents, needs_pricing = EXCLUDED.needs_pricing,
  food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Pastries
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, translations, image_url, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012',
   'Blueberry Spelt Muffins', NULL,
   '{"es":{"name":"Muffins de Espelta con Arándanos","description":"Muffins horneados a base de harina de espelta y kamut con arándanos frescos."}}'::jsonb,
   '/menu-photos/blueberry-spelt-muffins.jpg', 499, true, ARRAY['grains','fruits','sweeteners'], 10),

  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012',
   'Spelt Strawberry Waffles', NULL,
   '{"es":{"name":"Waffles de Espelta con Fresas","description":"Waffles de harina de espelta y centeno con fresas frescas y un toque de néctar de agave."}}'::jsonb,
   '/menu-photos/spelt-waffles.jpg', 899, true, ARRAY['grains','fruits','sweeteners'], 20),

  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012',
   'Hazelnut Butter Cookies', NULL,
   '{"es":{"name":"Galletas de Mantequilla de Avellana","description":"Galletas suaves hechas con mantequilla de avellana tostada y un toque de azúcar de coco o agave crudo."}}'::jsonb,
   '/menu-photos/hazelnut-cookies.jpg', 399, true, ARRAY['nuts_and_seeds','grains','sweeteners'], 30)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, translations = EXCLUDED.translations,
  image_url = EXCLUDED.image_url, price_cents = EXCLUDED.price_cents, needs_pricing = EXCLUDED.needs_pricing,
  food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Smoothies & Juices
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, translations, image_url, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000013',
   'Green Thing (Smoothie)', 'Kale, watercress, dandelion greens, apple, key lime, and walnuts.',
   '{"es":{"name":"Green Thing (Batido)","description":"Kale, hojas de diente de león, berro, manzana verde, lima, nueces y un toque de agave — para electrificar el cuerpo."}}'::jsonb,
   '/menu-photos/green-thing.jpg', 699, true, ARRAY['vegetables','fruits','nuts_and_seeds','sweeteners'], 10),

  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000013',
   'Berry Breeze (Smoothie)', 'Strawberry, blueberry, raspberry, banana, avocado, maca, and spirulina.',
   '{"es":{"name":"Berry Breeze (Batido)","description":"Fresas, arándanos, frambuesas, banano, aguacate y dátiles, con un toque de maca y espirulina."}}'::jsonb,
   '/menu-photos/berry-breeze.jpg', 799, true, ARRAY['fruits','vegetables','nuts_and_seeds'], 20),

  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000013',
   'Seamoss Shake', 'Seamoss, dates, coconut, vanilla, and nut milk.',
   '{"es":{"name":"Batido de Seamoss","description":"Musgo de mar, dátiles, leche de nuez, extracto de vainilla y un toque de mantequilla de girasol."}}'::jsonb,
   '/menu-photos/seamoss-shake.jpg', 899, true, ARRAY['sea_vegetables','sweeteners','nuts_and_seeds'], 30)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, translations = EXCLUDED.translations,
  image_url = EXCLUDED.image_url, price_cents = EXCLUDED.price_cents, needs_pricing = EXCLUDED.needs_pricing,
  food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- Chocolate: rotating sub-catalog, not fixed products — seeded as a single
-- placeholder rather than guessed-at variants. Split into real items once
-- the actual current selection is known.
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, translations, image_url, price_cents, needs_pricing, food_guide_tags, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000014',
   'Artisan Chocolate — ask about today''s selection',
   'Handmade truffles and dark/white chocolate bars, organic ingredients, sweetened with honey, coconut sugar, or maple. Infused and un-infused options available.',
   '{"es":{"name":"Chocolate Artesanal","description":"Pregunte por la selección de hoy — variedad de chocolates artesanales hechos a mano."}}'::jsonb,
   '/menu-photos/artisan-chocolate.jpg', 0, true, ARRAY['sweeteners'], 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, translations = EXCLUDED.translations,
  image_url = EXCLUDED.image_url, price_cents = EXCLUDED.price_cents, needs_pricing = EXCLUDED.needs_pricing,
  food_guide_tags = EXCLUDED.food_guide_tags, sort_order = EXCLUDED.sort_order;

-- General Store (Wholelistic Life Village) — nested into the same
-- multi-tenant schema as Iyānu's Kitchen. IDs below are the real
-- production values (this restaurant was created directly against the
-- live DB before being folded into this file, so IDs had to match what's
-- already live, not be freshly generated). No translations — this
-- catalog is only ever rendered by generalstore.html (SiteGround),
-- not this app's bilingual React storefront.
--
-- Shipping is flat and once-per-order ($8 domestic / $15 international),
-- not per-item — see shipping_fee_domestic_cents/shipping_fee_intl_cents
-- below and api/checkout.ts. Kitchen leaves both NULL (no shipping
-- charge; local pickup/delivery only). The Portal Tee's old per-item
-- "+ shipping (≈$36 total)" note is stale now that shipping is a flat
-- $8/$15 added automatically at checkout — cleared to match the other
-- tees rather than carried forward as misleading copy.
--
-- Batana Oil — Gallon is inquiry-only (too heavy for the flat shipping
-- rate): is_available = false so /api/restaurants/general-store never
-- returns it, but it stays visible in the dashboard for staff.
--
-- external_storefront_url: General Store's guest-facing storefront is
-- generalstore.html on SiteGround, not this app's /r/:slug/... route —
-- checkout.ts redirects Stripe's success/cancel back there instead of
-- assuming an in-app route exists. Kitchen leaves this NULL.
INSERT INTO restaurants
  (id, slug, name, description, address, phone, is_active, usd_hnl_exchange_rate,
   shipping_fee_domestic_cents, shipping_fee_intl_cents, external_storefront_url)
VALUES (
  'd2f9e5ea-ad72-4841-bac9-8893f965fd81',
  'general-store',
  'General Store',
  'What the village makes, grows, and wears.',
  'Cordillera Nombre de Dios, La Ceiba, Honduras',
  NULL,
  true,
  26.5,
  800,
  1500,
  'https://wholelisticlyfe.com/generalstore.html'
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, name = EXCLUDED.name, description = EXCLUDED.description,
  address = EXCLUDED.address, phone = EXCLUDED.phone, is_active = EXCLUDED.is_active,
  shipping_fee_domestic_cents = EXCLUDED.shipping_fee_domestic_cents,
  shipping_fee_intl_cents = EXCLUDED.shipping_fee_intl_cents,
  external_storefront_url = EXCLUDED.external_storefront_url;

INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES
  ('7405c32c-2756-47bc-8c50-1e9274487408', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'Body & Wellness', 1),
  ('e13ecbb5-ed25-47e4-a423-9b7d0e0f667b', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'Cacao', 2),
  ('d3c9a6a6-b3b3-4422-865f-79351964a140', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'Wear the Village', 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Body & Wellness
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, is_available, sort_order, variant_options)
VALUES
  ('31060b23-83b2-4b6d-a103-802eb4ad1193', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'Batana Oil — Liter', NULL, 13500, false, true, 1, '[]'),
  ('cbdf5f5d-ac50-45f0-a059-4aecbc1b8257', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'Batana Oil — Gallon', NULL, 45000, false, false, 2, '[]'),
  ('98c7616e-e843-4d57-a145-0152a8c725f0', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'Sea Moss', NULL, 0, true, false, 3, '[]'),
  ('c64f202b-e462-4e97-9cc4-84f28a09fa38', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'The Herbal Plumber', 'Detox blend. A month''s supply.', 13500, false, true, 4, '[]'),
  ('f718765c-6e3f-40fd-ac6d-9d5ef16f85dd', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'The Bitter Truth', 'Herbal blend. A month''s supply.', 13500, false, true, 5, '[]'),
  ('523a6729-2260-4f45-baac-ec16f992e634', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'The Olmeca', 'A month''s supply.', 13500, false, true, 6, '[]'),
  ('8253b34c-a6e8-4682-9510-4ed8faec8cff', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', '7405c32c-2756-47bc-8c50-1e9274487408',
   'Special Needs', 'Herbal blend. A month''s supply.', 13500, false, true, 7, '[]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, is_available = EXCLUDED.is_available, sort_order = EXCLUDED.sort_order,
  variant_options = EXCLUDED.variant_options;

-- Cacao
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, is_available, sort_order, variant_options)
VALUES
  ('01560d3c-2034-4a10-961c-c8b6fa0df3ff', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'e13ecbb5-ed25-47e4-a423-9b7d0e0f667b',
   'Cacao — By the Bag', NULL, 0, true, false, 1, '[]'),
  ('0b09d03c-e5c2-4630-86b4-4fe408c8af8e', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'e13ecbb5-ed25-47e4-a423-9b7d0e0f667b',
   'Cacao — Bulk', NULL, 0, true, false, 2, '[]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, is_available = EXCLUDED.is_available, sort_order = EXCLUDED.sort_order,
  variant_options = EXCLUDED.variant_options;

-- Wear the Village
INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, price_cents, needs_pricing, is_available, sort_order, variant_options)
VALUES
  ('c8d0d18d-057b-41b1-891d-d49f5d50cc70', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'd3c9a6a6-b3b3-4422-865f-79351964a140',
   'The Portal Tee', NULL, 2799, false, true, 1, '[]'),
  ('f480bb90-6ece-4640-94ab-234f8d2d33f7', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'd3c9a6a6-b3b3-4422-865f-79351964a140',
   'The Union Tee', NULL, 2700, false, true, 2, '[]'),
  ('c953dd57-4a51-41ff-94d4-54ec30066e68', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'd3c9a6a6-b3b3-4422-865f-79351964a140',
   'The Key Tee', NULL, 2700, false, true, 3, '[]'),
  ('5abb2d00-56a2-471a-a72c-3edc39fc8b19', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'd3c9a6a6-b3b3-4422-865f-79351964a140',
   'The Balance Tee', NULL, 2700, false, true, 4, '[]'),
  ('31da474c-4c1b-4049-87bb-f871a659ae5d', 'd2f9e5ea-ad72-4841-bac9-8893f965fd81', 'd3c9a6a6-b3b3-4422-865f-79351964a140',
   '4-Shirt Bundle', 'The Union, Key, Balance & Portal Tees — one of each.', 10800, false, true, 5, '[]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents,
  needs_pricing = EXCLUDED.needs_pricing, is_available = EXCLUDED.is_available, sort_order = EXCLUDED.sort_order,
  variant_options = EXCLUDED.variant_options;
