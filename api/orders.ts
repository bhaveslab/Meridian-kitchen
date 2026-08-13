import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_db";
import { fetchOrderById, fetchOrders } from "./_orders";
import { methodNotAllowed } from "./_http";
import { ORDER_STATUSES, type CreateOrderInput, type OrderStatus } from "../shared/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
    const tableId = typeof req.query.tableId === "string" ? req.query.tableId : undefined;
    const statuses = statusParam
      ? (statusParam.split(",").filter((s) => (ORDER_STATUSES as string[]).includes(s)) as OrderStatus[])
      : undefined;
    const orders = await fetchOrders({ statuses, tableId });
    return res.status(200).json(orders);
  }

  if (req.method === "POST") {
    const body = req.body as CreateOrderInput;
    if (!body?.tableId || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: "tableId and at least one item are required" });
    }
    for (const item of body.items) {
      if (!item.menuItemId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: "each item needs menuItemId and a positive integer quantity" });
      }
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const { rows: tableRows } = await client.query("SELECT id FROM tables WHERE id = $1", [body.tableId]);
      if (tableRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Table not found" });
      }

      const { rows: orderRows } = await client.query(
        "INSERT INTO orders (table_id, notes) VALUES ($1, $2) RETURNING id",
        [body.tableId, body.notes ?? null]
      );
      const orderId = orderRows[0].id as string;

      for (const item of body.items) {
        const { rows: menuItemRows } = await client.query(
          "SELECT price_cents FROM menu_items WHERE id = $1 AND is_available = true",
          [item.menuItemId]
        );
        if (menuItemRows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: `Menu item ${item.menuItemId} is not available` });
        }
        const priceCents = menuItemRows[0].price_cents as number;
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price_cents, special_instructions)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.menuItemId, item.quantity, priceCents, item.specialInstructions ?? null]
        );
      }

      await client.query("COMMIT");

      const order = await fetchOrderById(orderId);
      return res.status(201).json(order);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
