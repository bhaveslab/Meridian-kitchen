import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, sql } from "./_db.js";
import { getStripe } from "./_stripe.js";
import { methodNotAllowed, setCorsHeaders } from "./_http.js";
import type { CheckoutInput, CheckoutResponse } from "../shared/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, ["POST"]);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const body = req.body as CheckoutInput;
  if (!body?.restaurantId || !body.customerName?.trim() || !body.customerPhone?.trim()) {
    return res.status(400).json({ error: "restaurantId, customerName, and customerPhone are required" });
  }
  if (body.fulfillmentType !== "pickup" && body.fulfillmentType !== "delivery") {
    return res.status(400).json({ error: "fulfillmentType must be 'pickup' or 'delivery'" });
  }
  if (body.fulfillmentType === "delivery" && !body.deliveryAddress?.trim()) {
    return res.status(400).json({ error: "deliveryAddress is required for delivery orders" });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: "at least one item is required" });
  }
  for (const item of body.items) {
    if (!item.menuItemId || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ error: "each item needs menuItemId and a positive integer quantity" });
    }
  }

  const client = await db.connect();
  let orderId: string | undefined;
  let restaurantSlug: string | undefined;
  let externalStorefrontUrl: string | null = null;
  const lineItems: { name: string; priceCents: number; quantity: number }[] = [];

  try {
    await client.query("BEGIN");

    const { rows: restaurantRows } = await client.query(
      "SELECT slug, usd_hnl_exchange_rate, shipping_fee_domestic_cents, shipping_fee_intl_cents, external_storefront_url FROM restaurants WHERE id = $1 AND is_active = true",
      [body.restaurantId]
    );
    if (restaurantRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Restaurant not found" });
    }
    restaurantSlug = restaurantRows[0].slug as string;
    const exchangeRate = restaurantRows[0].usd_hnl_exchange_rate as string;
    const shippingDomesticCents = restaurantRows[0].shipping_fee_domestic_cents as number | null;
    const shippingIntlCents = restaurantRows[0].shipping_fee_intl_cents as number | null;
    externalStorefrontUrl = restaurantRows[0].external_storefront_url as string | null;

    // Only restaurants with a shipping fee configured (e.g. General Store)
    // require a shippingZone; Kitchen's local pickup/delivery never does.
    const chargesShipping = shippingDomesticCents != null || shippingIntlCents != null;
    let shippingCents: number | null = null;
    if (body.fulfillmentType === "delivery" && chargesShipping) {
      if (body.shippingZone !== "domestic" && body.shippingZone !== "international") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "shippingZone must be 'domestic' or 'international' for this restaurant" });
      }
      shippingCents = body.shippingZone === "domestic" ? shippingDomesticCents : shippingIntlCents;
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (restaurant_id, customer_name, customer_phone, customer_email, fulfillment_type, delivery_address,
          notes, exchange_rate_hnl_per_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        body.restaurantId,
        body.customerName.trim(),
        body.customerPhone.trim(),
        body.customerEmail?.trim() || null,
        body.fulfillmentType,
        body.deliveryAddress?.trim() || null,
        body.notes?.trim() || null,
        exchangeRate,
      ]
    );
    orderId = orderRows[0].id as string;

    for (const item of body.items) {
      const { rows: menuItemRows } = await client.query(
        "SELECT name, price_cents, variant_options FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true",
        [item.menuItemId, body.restaurantId]
      );
      if (menuItemRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Menu item ${item.menuItemId} is not available` });
      }
      const basePriceCents = menuItemRows[0].price_cents as number;
      const variantOptions = (menuItemRows[0].variant_options ?? []) as {
        key: string;
        choices: { value: string; priceDeltaCents: number }[];
      }[];

      const selectedVariants = item.selectedVariants ?? {};
      let priceDeltaCents = 0;
      for (const group of variantOptions) {
        const selectedValue = selectedVariants[group.key];
        const choice = group.choices.find((c) => c.value === selectedValue);
        if (!choice) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: `Missing or invalid choice for "${group.key}" on ${menuItemRows[0].name}` });
        }
        priceDeltaCents += choice.priceDeltaCents;
      }
      const unitPriceCents = basePriceCents + priceDeltaCents;

      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price_cents, selected_variants, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.menuItemId, item.quantity, unitPriceCents, JSON.stringify(selectedVariants), item.specialInstructions ?? null]
      );
      lineItems.push({ name: menuItemRows[0].name as string, priceCents: unitPriceCents, quantity: item.quantity });
    }

    // Flat, once-per-order fee — not tied to any single item, so it's a
    // Stripe line item only, not an order_items row.
    if (shippingCents != null) {
      lineItems.push({
        name: body.shippingZone === "domestic" ? "Shipping (US)" : "Shipping (International)",
        priceCents: shippingCents,
        quantity: 1,
      });
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
  // Restaurants with a storefront outside this app (external_storefront_url
  // set) don't have an in-app /r/:slug/... route to redirect back to —
  // that route only exists in this app's own React storefront.
  const successUrl = externalStorefrontUrl
    ? `${externalStorefrontUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/r/${restaurantSlug}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = externalStorefrontUrl
    ? `${externalStorefrontUrl}?checkout=cancelled`
    : `${origin}/r/${restaurantSlug}?checkout=cancelled`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.priceCents,
        product_data: { name: item.name },
      },
    })),
    metadata: { orderId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  await sql`
    UPDATE orders SET stripe_checkout_session_id = ${session.id} WHERE id = ${orderId}
  `;

  const response: CheckoutResponse = { orderId: orderId!, checkoutUrl: session.url! };
  return res.status(201).json(response);
}
