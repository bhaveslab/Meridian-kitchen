import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapTable } from "./_db";
import { methodNotAllowed } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { rows } = await sql`SELECT * FROM tables ORDER BY label ASC`;
    return res.status(200).json(rows.map(mapTable));
  }

  if (req.method === "POST") {
    const { label, seats } = req.body ?? {};
    if (!label || typeof label !== "string") {
      return res.status(400).json({ error: "label is required" });
    }
    const { rows } = await sql`
      INSERT INTO tables (label, seats)
      VALUES (${label}, ${seats ?? null})
      RETURNING *
    `;
    return res.status(201).json(mapTable(rows[0]));
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
