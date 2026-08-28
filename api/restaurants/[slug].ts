import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapRestaurant, mapCategory, mapMenuItem } from "../_db.js";
import { methodNotAllowed, setCorsHeaders } from "../_http.js";
import { requireDashboardAuth } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, ["GET", "PATCH"]);
  if (req.method === "OPTIONS") return res.status(200).end();

  const slug = req.query.slug as string;

  if (req.method === "PATCH") {
    if (!requireDashboardAuth(req, res)) return;
    const { usdHnlExchangeRate } = req.body ?? {};
    if (typeof usdHnlExchangeRate !== "number" || usdHnlExchangeRate <= 0) {
      return res.status(400).json({ error: "usdHnlExchangeRate must be a positive number" });
    }
    const { rows } = await sql`
      UPDATE restaurants SET usd_hnl_exchange_rate = ${usdHnlExchangeRate} WHERE slug = ${slug}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Restaurant not found" });
    return res.status(200).json(mapRestaurant(rows[0]));
  }

  if (req.method !== "GET") return methodNotAllowed(res, ["GET", "PATCH"]);

  const { rows: restaurantRows } = await sql`
    SELECT * FROM restaurants WHERE slug = ${slug} AND is_active = true
  `;
  if (restaurantRows.length === 0) {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  const restaurant = mapRestaurant(restaurantRows[0]);

  const [{ rows: categoryRows }, { rows: itemRows }] = await Promise.all([
    sql`SELECT * FROM menu_categories WHERE restaurant_id = ${restaurant.id} ORDER BY sort_order ASC, name ASC`,
    sql`
      SELECT * FROM menu_items
      WHERE restaurant_id = ${restaurant.id} AND is_available = true
      ORDER BY sort_order ASC, name ASC
    `,
  ]);

  return res.status(200).json({
    restaurant,
    categories: categoryRows.map(mapCategory),
    items: itemRows.map(mapMenuItem),
  });
}
