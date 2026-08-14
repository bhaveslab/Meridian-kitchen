import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapMenuItem } from "./_db";
import { methodNotAllowed } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const restaurantId = typeof req.query.restaurantId === "string" ? req.query.restaurantId : undefined;
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }
    const { rows } = categoryId
      ? await sql`
          SELECT * FROM menu_items
          WHERE restaurant_id = ${restaurantId} AND category_id = ${categoryId}
          ORDER BY sort_order ASC, name ASC
        `
      : await sql`
          SELECT * FROM menu_items WHERE restaurant_id = ${restaurantId} ORDER BY sort_order ASC, name ASC
        `;
    return res.status(200).json(rows.map(mapMenuItem));
  }

  if (req.method === "POST") {
    const { restaurantId, categoryId, name, description, priceCents, isAvailable, sortOrder } = req.body ?? {};
    if (!restaurantId || !categoryId || !name || typeof priceCents !== "number") {
      return res.status(400).json({ error: "restaurantId, categoryId, name, and priceCents are required" });
    }
    const { rows } = await sql`
      INSERT INTO menu_items (restaurant_id, category_id, name, description, price_cents, is_available, sort_order)
      VALUES (
        ${restaurantId}, ${categoryId}, ${name}, ${description ?? null},
        ${priceCents}, ${isAvailable ?? true}, ${sortOrder ?? 0}
      )
      RETURNING *
    `;
    return res.status(201).json(mapMenuItem(rows[0]));
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
