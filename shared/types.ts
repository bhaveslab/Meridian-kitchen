// Shared between /api (serverless functions) and /src (frontend).

import type { Locale } from "./i18n";
import type { FoodGuideCategoryKey } from "./foodGuide";

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

// Non-default-locale overrides. English lives in the entity's own
// name/description fields and is the fallback when a translation is missing.
export interface FieldTranslation {
  name?: string;
  description?: string;
}
export type Translations = Partial<Record<Exclude<Locale, "en">, FieldTranslation>>;

export interface VariantChoice {
  value: string;
  labelEn: string;
  labelEs: string;
  priceDeltaCents: number;
}

export interface VariantOption {
  key: string;
  labelEn: string;
  labelEs: string;
  choices: VariantChoice[];
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  usdHnlExchangeRate: number;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  translations: Translations;
  sortOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  translations: Translations;
  imageUrl: string | null;
  priceCents: number;
  needsPricing: boolean;
  isAvailable: boolean;
  sortOrder: number;
  foodGuideTags: FoodGuideCategoryKey[];
  variantOptions: VariantOption[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPriceCents: number;
  selectedVariants: Record<string, string>;
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
  exchangeRateHnlPerUsd: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
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
