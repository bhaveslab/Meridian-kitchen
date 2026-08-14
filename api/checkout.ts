import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, sql } from "./_db";
import { getStripe } from "./_stripe";
import { methodNotAllowed } from "./_http";
import type { CheckoutInput, CheckoutResponse } from "../shared/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const lineItems: { name: string; priceCents: number; quantity: number }[] = [];

  try {
    await client.query("BEGIN");

    const { rows: restaurantRows } = await client.query(
      "SELECT slug FROM restaurants WHERE id = $1 AND is_active = true",
      [body.restaurantId]
    );
    if (restaurantRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Restaurant not found" });
    }
    restaurantSlug = restaurantRows[0].slug as string;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (restaurant_id, customer_name, customer_phone, customer_email, fulfillment_type, delivery_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        body.restaurantId,
        body.customerName.trim(),
        body.customerPhone.trim(),
        body.customerEmail?.trim() || null,
        body.fulfillmentType,
        body.deliveryAddress?.trim() || null,
        body.notes?.trim() || null,
      ]
    );
    orderId = orderRows[0].id as string;

    for (const item of body.items) {
      const { rows: menuItemRows } = await client.query(
        "SELECT name, price_cents FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true",
        [item.menuItemId, body.restaurantId]
      );
      if (menuItemRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Menu item ${item.menuItemId} is not available` });
      }
      const priceCents = menuItemRows[0].price_cents as number;
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price_cents, special_instructions)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menuItemId, item.quantity, priceCents, item.specialInstructions ?? null]
      );
      lineItems.push({ name: menuItemRows[0].name as string, priceCents, quantity: item.quantity });
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
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
    success_url: `${origin}/r/${restaurantSlug}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/r/${restaurantSlug}?checkout=cancelled`,
  });

  await sql`
    UPDATE orders SET stripe_checkout_session_id = ${session.id} WHERE id = ${orderId}
  `;

  const response: CheckoutResponse = { orderId: orderId!, checkoutUrl: session.url! };
  return res.status(201).json(response);
}
