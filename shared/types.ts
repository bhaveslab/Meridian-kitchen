// Shared between /api (serverless functions) and /src (frontend).

export type OrderStatus = "received" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

// Orders a restaurant's dashboard should treat as still in flight.
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["received", "preparing", "ready", "out_for_delivery"];

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type FulfillmentType = "pickup" | "delivery";

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  isAvailable: boolean;
  sortOrder: number;
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
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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

export interface CheckoutInput {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface CheckoutResponse {
  orderId: string;
  checkoutUrl: string;
}

export interface StorefrontResponse {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
}
