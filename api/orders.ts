import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchOrders } from "./_orders.js";
import { methodNotAllowed } from "./_http.js";
import { requireDashboardAuth } from "./_auth.js";
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "../shared/types.js";

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  if (!requireDashboardAuth(req, res)) return;

  const restaurantId = typeof req.query.restaurantId === "string" ? req.query.restaurantId : undefined;
  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  const statuses = statusParam
    ? (statusParam.split(",").filter((s) => (ORDER_STATUSES as string[]).includes(s)) as OrderStatus[])
    : undefined;

  const paymentStatusParam = typeof req.query.paymentStatus === "string" ? req.query.paymentStatus : undefined;
  // A restaurant's order queue only wants orders that actually completed checkout;
  // default away from surfacing abandoned/unpaid carts unless explicitly requested.
  const paymentStatuses = paymentStatusParam
    ? (paymentStatusParam.split(",").filter((s) => (PAYMENT_STATUSES as string[]).includes(s)) as PaymentStatus[])
    : (["paid"] as PaymentStatus[]);

  const orders = await fetchOrders({ restaurantId, statuses, paymentStatuses });
  return res.status(200).json(orders);
}
