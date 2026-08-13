import { query, mapOrderItem } from "./_db";
import type { Order, OrderItem, OrderStatus } from "../shared/types";

interface OrderRow {
  id: string;
  table_id: string;
  table_label: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    tableId: row.table_id,
    tableLabel: row.table_label,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
  };
}

async function fetchItemsForOrders(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
  const itemsByOrder = new Map<string, OrderItem[]>();
  if (orderIds.length === 0) return itemsByOrder;

  const { rows } = await query(
    `SELECT oi.*, mi.name AS menu_item_name
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = ANY($1)
     ORDER BY oi.created_at ASC`,
    [orderIds]
  );

  for (const row of rows) {
    const item = mapOrderItem(row);
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  return itemsByOrder;
}

export async function fetchOrders(filter: { statuses?: OrderStatus[]; tableId?: string }): Promise<Order[]> {
  const { statuses, tableId } = filter;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (statuses && statuses.length > 0) {
    params.push(statuses);
    conditions.push(`o.status = ANY($${params.length})`);
  }
  if (tableId) {
    params.push(tableId);
    conditions.push(`o.table_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = conditions.length > 0 ? "ORDER BY o.created_at ASC" : "ORDER BY o.created_at DESC LIMIT 200";

  const { rows: orderRows } = await query<OrderRow>(
    `SELECT o.*, t.label AS table_label
     FROM orders o JOIN tables t ON t.id = o.table_id
     ${where}
     ${orderClause}`,
    params
  );

  const itemsByOrder = await fetchItemsForOrders(orderRows.map((r) => r.id));
  return orderRows.map((row) => toOrder(row, itemsByOrder.get(row.id) ?? []));
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  const { rows } = await query<OrderRow>(
    `SELECT o.*, t.label AS table_label
     FROM orders o JOIN tables t ON t.id = o.table_id
     WHERE o.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;

  const itemsByOrder = await fetchItemsForOrders([id]);
  return toOrder(rows[0], itemsByOrder.get(id) ?? []);
}
