import type {
  CheckoutInput,
  CheckoutResponse,
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  PaymentStatus,
  Restaurant,
  StorefrontResponse,
  Translations,
  VariantOption,
} from "../../shared/types";
import type { FoodGuideCategoryKey } from "../../shared/foodGuide";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request to ${path} failed with ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Storefront (public, per-restaurant)
export const getStorefront = (slug: string) => request<StorefrontResponse>(`/api/restaurants/${slug}`);
export const updateExchangeRate = (slug: string, usdHnlExchangeRate: number) =>
  request<Restaurant>(`/api/restaurants/${slug}`, {
    method: "PATCH",
    body: JSON.stringify({ usdHnlExchangeRate }),
  });

// Checkout
export const checkout = (input: CheckoutInput) =>
  request<CheckoutResponse>("/api/checkout", { method: "POST", body: JSON.stringify(input) });

// Categories
export const getCategories = (restaurantId: string) =>
  request<MenuCategory[]>(`/api/categories?restaurantId=${restaurantId}`);
export const createCategory = (input: {
  restaurantId: string;
  name: string;
  sortOrder?: number;
  translations?: Translations;
}) => request<MenuCategory>("/api/categories", { method: "POST", body: JSON.stringify(input) });
export const updateCategory = (
  id: string,
  input: Partial<{ name: string; sortOrder: number; translations: Translations }>
) => request<MenuCategory>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteCategory = (id: string) => request<void>(`/api/categories/${id}`, { method: "DELETE" });

// Menu items
export const getMenuItems = (restaurantId: string, categoryId?: string) =>
  request<MenuItem[]>(
    categoryId
      ? `/api/menu-items?restaurantId=${restaurantId}&categoryId=${categoryId}`
      : `/api/menu-items?restaurantId=${restaurantId}`
  );
export const createMenuItem = (input: {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceCents: number;
  needsPricing?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
  translations?: Translations;
  foodGuideTags?: FoodGuideCategoryKey[];
  variantOptions?: VariantOption[];
}) => request<MenuItem>("/api/menu-items", { method: "POST", body: JSON.stringify(input) });
export const updateMenuItem = (
  id: string,
  input: Partial<{
    categoryId: string;
    name: string;
    description: string;
    imageUrl: string;
    priceCents: number;
    needsPricing: boolean;
    isAvailable: boolean;
    sortOrder: number;
    translations: Translations;
    foodGuideTags: FoodGuideCategoryKey[];
    variantOptions: VariantOption[];
  }>
) => request<MenuItem>(`/api/menu-items/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteMenuItem = (id: string) => request<void>(`/api/menu-items/${id}`, { method: "DELETE" });

// Orders (restaurant dashboard)
export const getOrders = (filter: { restaurantId: string; statuses?: OrderStatus[]; paymentStatuses?: PaymentStatus[] }) => {
  const params = new URLSearchParams({ restaurantId: filter.restaurantId });
  if (filter.statuses?.length) params.set("status", filter.statuses.join(","));
  if (filter.paymentStatuses?.length) params.set("paymentStatus", filter.paymentStatuses.join(","));
  return request<Order[]>(`/api/orders?${params.toString()}`);
};
export const getOrder = (id: string) => request<Order>(`/api/orders/${id}`);
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
