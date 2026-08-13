import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapMenuItem } from "./_db";
import { methodNotAllowed } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    const { rows } = categoryId
      ? await sql`SELECT * FROM menu_items WHERE category_id = ${categoryId} ORDER BY sort_order ASC, name ASC`
      : await sql`SELECT * FROM menu_items ORDER BY sort_order ASC, name ASC`;
    return res.status(200).json(rows.map(mapMenuItem));
  }

  if (req.method === "POST") {
    const { categoryId, name, description, priceCents, isAvailable, sortOrder } = req.body ?? {};
    if (!categoryId || !name || typeof priceCents !== "number") {
      return res.status(400).json({ error: "categoryId, name, and priceCents are required" });
    }
    const { rows } = await sql`
      INSERT INTO menu_items (category_id, name, description, price_cents, is_available, sort_order)
      VALUES (${categoryId}, ${name}, ${description ?? null}, ${priceCents}, ${isAvailable ?? true}, ${sortOrder ?? 0})
      RETURNING *
    `;
    return res.status(201).json(mapMenuItem(rows[0]));
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
