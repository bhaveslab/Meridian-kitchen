import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapCategory } from "./_db";
import { methodNotAllowed } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { rows } = await sql`SELECT * FROM menu_categories ORDER BY sort_order ASC, name ASC`;
    return res.status(200).json(rows.map(mapCategory));
  }

  if (req.method === "POST") {
    const { name, sortOrder } = req.body ?? {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    const { rows } = await sql`
      INSERT INTO menu_categories (name, sort_order)
      VALUES (${name}, ${sortOrder ?? 0})
      RETURNING *
    `;
    return res.status(201).json(mapCategory(rows[0]));
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
