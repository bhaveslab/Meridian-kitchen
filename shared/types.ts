// Shared between /api (serverless functions) and /src (frontend).

export type OrderStatus = "placed" | "in_progress" | "ready" | "served" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["placed", "in_progress", "ready", "served", "cancelled"];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["placed", "in_progress", "ready"];

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface RestaurantTable {
  id: string;
  label: string;
  seats: number | null;
  guestToken: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPriceCents: number;
  specialInstructions: string | null;
}

export interface Order {
  id: string;
  tableId: string;
  tableLabel: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface CreateOrderInput {
  tableId: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface GuestMenuResponse {
  table: RestaurantTable;
  categories: MenuCategory[];
  items: MenuItem[];
}
