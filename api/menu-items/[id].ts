import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapMenuItem } from "../_db";
import { methodNotAllowed } from "../_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (req.method === "PATCH") {
    const { categoryId, name, description, priceCents, isAvailable, sortOrder } = req.body ?? {};
    const { rows } = await sql`
      UPDATE menu_items
      SET category_id = COALESCE(${categoryId ?? null}, category_id),
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          price_cents = COALESCE(${priceCents ?? null}, price_cents),
          is_available = COALESCE(${isAvailable ?? null}, is_available),
          sort_order = COALESCE(${sortOrder ?? null}, sort_order)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Menu item not found" });
    return res.status(200).json(mapMenuItem(rows[0]));
  }

  if (req.method === "DELETE") {
    const { rowCount } = await sql`DELETE FROM menu_items WHERE id = ${id}`;
    if (rowCount === 0) return res.status(404).json({ error: "Menu item not found" });
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["PATCH", "DELETE"]);
}
