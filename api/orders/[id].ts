import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_db.js";
import { fetchOrderById } from "../_orders.js";
import { methodNotAllowed } from "../_http.js";
import { requireDashboardAuth } from "../_auth.js";
import { ORDER_STATUSES } from "../../shared/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (req.method === "GET") {
    // Public: the guest's own order-status page polls this by ID.
    const order = await fetchOrderById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.status(200).json(order);
  }

  if (req.method === "PATCH") {
    if (!requireDashboardAuth(req, res)) return;
    const { status } = req.body ?? {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${ORDER_STATUSES.join(", ")}` });
    }
    const { rowCount } = await sql`
      UPDATE orders SET status = ${status}, updated_at = now() WHERE id = ${id}
    `;
    if (rowCount === 0) return res.status(404).json({ error: "Order not found" });
    const order = await fetchOrderById(id);
    return res.status(200).json(order);
  }

  return methodNotAllowed(res, ["GET", "PATCH"]);
}
