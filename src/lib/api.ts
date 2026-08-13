import type {
  CreateOrderInput,
  GuestMenuResponse,
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  RestaurantTable,
} from "../../shared/types";

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

// Categories
export const getCategories = () => request<MenuCategory[]>("/api/categories");
export const createCategory = (input: { name: string; sortOrder?: number }) =>
  request<MenuCategory>("/api/categories", { method: "POST", body: JSON.stringify(input) });
export const updateCategory = (id: string, input: Partial<{ name: string; sortOrder: number }>) =>
  request<MenuCategory>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteCategory = (id: string) =>
  request<void>(`/api/categories/${id}`, { method: "DELETE" });

// Menu items
export const getMenuItems = (categoryId?: string) =>
  request<MenuItem[]>(categoryId ? `/api/menu-items?categoryId=${categoryId}` : "/api/menu-items");
export const createMenuItem = (input: {
  categoryId: string;
  name: string;
  description?: string;
  priceCents: number;
  isAvailable?: boolean;
  sortOrder?: number;
}) => request<MenuItem>("/api/menu-items", { method: "POST", body: JSON.stringify(input) });
export const updateMenuItem = (
  id: string,
  input: Partial<{
    categoryId: string;
    name: string;
    description: string;
    priceCents: number;
    isAvailable: boolean;
    sortOrder: number;
  }>
) => request<MenuItem>(`/api/menu-items/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteMenuItem = (id: string) =>
  request<void>(`/api/menu-items/${id}`, { method: "DELETE" });

// Tables
export const getTables = () => request<RestaurantTable[]>("/api/tables");
export const createTable = (input: { label: string; seats?: number }) =>
  request<RestaurantTable>("/api/tables", { method: "POST", body: JSON.stringify(input) });
export const updateTable = (id: string, input: Partial<{ label: string; seats: number }>) =>
  request<RestaurantTable>(`/api/tables/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteTable = (id: string) => request<void>(`/api/tables/${id}`, { method: "DELETE" });

// Guest
export const getGuestMenu = (token: string) =>
  request<GuestMenuResponse>(`/api/tables/by-token/${token}`);

// Orders
export const getOrders = (filter?: { statuses?: OrderStatus[]; tableId?: string }) => {
  const params = new URLSearchParams();
  if (filter?.statuses?.length) params.set("status", filter.statuses.join(","));
  if (filter?.tableId) params.set("tableId", filter.tableId);
  const qs = params.toString();
  return request<Order[]>(`/api/orders${qs ? `?${qs}` : ""}`);
};
export const getOrder = (id: string) => request<Order>(`/api/orders/${id}`);
export const createOrder = (input: CreateOrderInput) =>
  request<Order>("/api/orders", { method: "POST", body: JSON.stringify(input) });
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
