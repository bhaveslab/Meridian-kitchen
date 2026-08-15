// Static UI chrome strings (buttons, labels). Menu content (item/category
// names & descriptions) is NOT here — that comes from the translations
// JSONB column on menu_categories/menu_items, since it's restaurant data.

export type Locale = "en" | "es";
export const SUPPORTED_LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";

type Dictionary = Record<string, { en: string; es: string }>;

export const UI_STRINGS = {
  checkout: { en: "Checkout", es: "Pagar" },
  backToMenu: { en: "← Back to menu", es: "← Volver al menú" },
  yourDetails: { en: "Your details", es: "Tus datos" },
  name: { en: "Name", es: "Nombre" },
  phone: { en: "Phone", es: "Teléfono" },
  emailOptional: { en: "Email (optional)", es: "Correo (opcional)" },
  fulfillment: { en: "Fulfillment", es: "Entrega" },
  pickup: { en: "Pickup", es: "Recoger" },
  delivery: { en: "Delivery", es: "Domicilio" },
  deliveryAddress: { en: "Delivery address", es: "Dirección de entrega" },
  notesForKitchen: { en: "Notes for the kitchen (optional)", es: "Notas para la cocina (opcional)" },
  notesPlaceholder: { en: "Allergies, special requests…", es: "Alergias, solicitudes especiales…" },
  redirectingToPayment: { en: "Redirecting to payment…", es: "Redirigiendo al pago…" },
  pay: { en: "Pay", es: "Pagar" },
  total: { en: "Total", es: "Total" },
  item: { en: "item", es: "artículo" },
  items: { en: "items", es: "artículos" },
  orderConfirmation: { en: "Order confirmation", es: "Confirmación del pedido" },
  confirmingPayment: { en: "Confirming your payment…", es: "Confirmando tu pago…" },
  paymentFailed: {
    en: "Payment failed. Please try ordering again.",
    es: "El pago falló. Por favor intenta pedir de nuevo.",
  },
  loadingMenu: { en: "Loading menu…", es: "Cargando menú…" },
  noActiveOrders: { en: "No active orders.", es: "No hay pedidos activos." },
  statusReceived: { en: "Your order has been received.", es: "Hemos recibido tu pedido." },
  statusPreparing: { en: "The kitchen is preparing your order.", es: "La cocina está preparando tu pedido." },
  statusReady: { en: "Your order is ready.", es: "Tu pedido está listo." },
  statusOutForDelivery: { en: "Your order is out for delivery.", es: "Tu pedido está en camino." },
  statusCompleted: { en: "Order complete. Enjoy your meal!", es: "Pedido completo. ¡Buen provecho!" },
  statusCancelled: { en: "This order was cancelled.", es: "Este pedido fue cancelado." },
  dashboardOrders: { en: "Orders", es: "Pedidos" },
  dashboardMenu: { en: "Menu", es: "Menú" },
  viewStorefront: { en: "View storefront", es: "Ver tienda" },
  addCategory: { en: "Add category", es: "Agregar categoría" },
  addItem: { en: "Add item", es: "Agregar artículo" },
  deleteCategory: { en: "Delete category", es: "Eliminar categoría" },
  delete: { en: "Delete", es: "Eliminar" },
  markUnavailable: { en: "Mark 86'd", es: "Marcar agotado" },
  markAvailable: { en: "Mark available", es: "Marcar disponible" },
  needsPricing: { en: "Needs pricing", es: "Falta precio" },
  startPreparing: { en: "Start preparing", es: "Empezar a preparar" },
  markReady: { en: "Mark ready", es: "Marcar listo" },
  outForDelivery: { en: "Out for delivery", es: "Enviar a domicilio" },
  complete: { en: "Complete", es: "Completar" },
  cancel: { en: "Cancel", es: "Cancelar" },
  exchangeRateLabel: { en: "USD → HNL display rate", es: "Tasa de cambio USD → HNL" },
  save: { en: "Save", es: "Guardar" },
  viewMenu: { en: "View menu", es: "Ver menú" },
  menuTitle: { en: "Menu", es: "Menú" },
  allCategory: { en: "All", es: "Todos" },
  yourOrder: { en: "Your order", es: "Tu pedido" },
  emptyCart: { en: "Your cart is empty", es: "Tu carrito está vacío" },
  browseMenu: { en: "Browse the menu", es: "Ver el menú" },
  addToCart: { en: "Add to cart", es: "Agregar al carrito" },
  askStaff: { en: "Ask staff", es: "Pregunte al personal" },
  subtotal: { en: "Subtotal", es: "Subtotal" },
  orderReceived: { en: "Order received", es: "Pedido recibido" },
  thankYou: { en: "Thank you for your order!", es: "¡Gracias por tu pedido!" },
  noPhoto: { en: "Photo coming soon", es: "Foto próximamente" },
  priceVaries: { en: "Price varies", es: "Precio varía" },
} as const satisfies Dictionary;

export type UiStringKey = keyof typeof UI_STRINGS;

export function translate(key: UiStringKey, locale: Locale): string {
  return UI_STRINGS[key][locale];
}
