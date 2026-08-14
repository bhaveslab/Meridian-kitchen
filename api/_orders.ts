import { query, mapOrderItem } from "./_db";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "../shared/types";

interface OrderRow {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  fulfillment_type: Order["fulfillmentType"];
  delivery_address: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    fulfillmentType: row.fulfillment_type,
    deliveryAddress: row.delivery_address,
    status: row.status,
    paymentStatus: row.payment_status,
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

export async function fetchOrders(filter: {
  restaurantId: string;
  statuses?: OrderStatus[];
  paymentStatuses?: PaymentStatus[];
}): Promise<Order[]> {
  const { restaurantId, statuses, paymentStatuses } = filter;
  const params: unknown[] = [restaurantId];
  const conditions = ["o.restaurant_id = $1"];

  if (statuses && statuses.length > 0) {
    params.push(statuses);
    conditions.push(`o.status = ANY($${params.length})`);
  }
  if (paymentStatuses && paymentStatuses.length > 0) {
    params.push(paymentStatuses);
    conditions.push(`o.payment_status = ANY($${params.length})`);
  }

  const { rows: orderRows } = await query<OrderRow>(
    `SELECT o.* FROM orders o
     WHERE ${conditions.join(" AND ")}
     ORDER BY o.created_at ASC
     LIMIT 200`,
    params
  );

  const itemsByOrder = await fetchItemsForOrders(orderRows.map((r) => r.id));
  return orderRows.map((row) => toOrder(row, itemsByOrder.get(row.id) ?? []));
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  const { rows } = await query<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (rows.length === 0) return null;

  const itemsByOrder = await fetchItemsForOrders([id]);
  return toOrder(rows[0], itemsByOrder.get(id) ?? []);
}
