import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapTable } from "../_db";
import { methodNotAllowed } from "../_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (req.method === "PATCH") {
    const { label, seats } = req.body ?? {};
    const { rows } = await sql`
      UPDATE tables
      SET label = COALESCE(${label ?? null}, label),
          seats = COALESCE(${seats ?? null}, seats)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Table not found" });
    return res.status(200).json(mapTable(rows[0]));
  }

  if (req.method === "DELETE") {
    const { rowCount } = await sql`DELETE FROM tables WHERE id = ${id}`;
    if (rowCount === 0) return res.status(404).json({ error: "Table not found" });
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["PATCH", "DELETE"]);
}
