import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapCategory } from "../_db";
import { methodNotAllowed } from "../_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (req.method === "PATCH") {
    const { name, sortOrder, translations } = req.body ?? {};
    const { rows } = await sql`
      UPDATE menu_categories
      SET name = COALESCE(${name ?? null}, name),
          sort_order = COALESCE(${sortOrder ?? null}, sort_order),
          translations = COALESCE(${translations ? JSON.stringify(translations) : null}::jsonb, translations)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Category not found" });
    return res.status(200).json(mapCategory(rows[0]));
  }

  if (req.method === "DELETE") {
    const { rowCount } = await sql`DELETE FROM menu_categories WHERE id = ${id}`;
    if (rowCount === 0) return res.status(404).json({ error: "Category not found" });
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["PATCH", "DELETE"]);
}
