import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapTable, mapCategory, mapMenuItem } from "../../_db";
import { methodNotAllowed } from "../../_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = req.query.token as string;
  const { rows: tableRows } = await sql`SELECT * FROM tables WHERE guest_token = ${token}`;
  if (tableRows.length === 0) {
    return res.status(404).json({ error: "Table not found" });
  }

  const [{ rows: categoryRows }, { rows: itemRows }] = await Promise.all([
    sql`SELECT * FROM menu_categories ORDER BY sort_order ASC, name ASC`,
    sql`SELECT * FROM menu_items WHERE is_available = true ORDER BY sort_order ASC, name ASC`,
  ]);

  return res.status(200).json({
    table: mapTable(tableRows[0]),
    categories: categoryRows.map(mapCategory),
    items: itemRows.map(mapMenuItem),
  });
}
