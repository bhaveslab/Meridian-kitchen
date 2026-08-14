import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapCategory } from "./_db";
import { methodNotAllowed } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const restaurantId = typeof req.query.restaurantId === "string" ? req.query.restaurantId : undefined;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }
    const { rows } = await sql`
      SELECT * FROM menu_categories WHERE restaurant_id = ${restaurantId} ORDER BY sort_order ASC, name ASC
    `;
    return res.status(200).json(rows.map(mapCategory));
  }

  if (req.method === "POST") {
    const { restaurantId, name, sortOrder, translations } = req.body ?? {};
    if (!restaurantId || !name || typeof name !== "string") {
      return res.status(400).json({ error: "restaurantId and name are required" });
    }
    const { rows } = await sql`
      INSERT INTO menu_categories (restaurant_id, name, sort_order, translations)
      VALUES (${restaurantId}, ${name}, ${sortOrder ?? 0}, ${JSON.stringify(translations ?? {})})
      RETURNING *
    `;
    return res.status(201).json(mapCategory(rows[0]));
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
