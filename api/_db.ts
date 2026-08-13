import { sql, db } from "@vercel/postgres";
import type { MenuCategory, MenuItem, RestaurantTable, OrderItem } from "../shared/types";

export { sql, db };

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  const client = await db.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}

export function mapCategory(row: any): MenuCategory {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function mapMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    isAvailable: row.is_available,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function mapTable(row: any): RestaurantTable {
  return {
    id: row.id,
    label: row.label,
    seats: row.seats,
    guestToken: row.guest_token,
    createdAt: row.created_at,
  };
}

export function mapOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    menuItemId: row.menu_item_id,
    menuItemName: row.menu_item_name,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    specialInstructions: row.special_instructions,
  };
}
