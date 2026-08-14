import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapRestaurant, mapCategory, mapMenuItem } from "../_db";
import { methodNotAllowed } from "../_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const slug = req.query.slug as string;
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
