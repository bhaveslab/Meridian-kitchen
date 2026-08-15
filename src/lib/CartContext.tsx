import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MenuItem } from "../../shared/types";

export interface CartEntry {
  item: MenuItem;
  quantity: number;
  selectedVariants: Record<string, string>;
  unitPriceCents: number;
}

interface CartContextValue {
  entries: CartEntry[];
  totalCount: number;
  totalCents: number;
  quantityOf: (itemId: string) => number;
  setQuantity: (itemId: string, quantity: number) => void;
  quickAdd: (itemId: string) => void;
  setVariantChoice: (itemId: string, groupKey: string, value: string) => void;
  variantsFor: (item: MenuItem) => Record<string, string>;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function defaultVariants(item: MenuItem, override?: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const group of item.variantOptions) {
    result[group.key] = override?.[group.key] ?? group.choices[0]?.value ?? "";
  }
  return result;
}

function priceWithVariants(item: MenuItem, selected: Record<string, string>): number {
  let total = item.priceCents;
  for (const group of item.variantOptions) {
    const choice = group.choices.find((c) => c.value === selected[group.key]);
    if (choice) total += choice.priceDeltaCents;
  }
  return total;
}

// One cart line per menu item: changing a variant selector while a line has
// quantity > 0 changes the variant that whole line orders. Good enough while
// only one item (Electric Falafels) has variants; revisit if a future item
// needs the same dish ordered with two different variants in one cart.
export function CartProvider({ items, children }: { items: MenuItem[]; children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [variantSelections, setVariantSelections] = useState<Record<string, Record<string, string>>>({});

  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    items.forEach((i) => map.set(i.id, i));
    return map;
  }, [items]);

  const entries: CartEntry[] = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => {
          const item = itemsById.get(itemId);
          if (!item) return null;
          const selectedVariants = defaultVariants(item, variantSelections[itemId]);
          return { item, quantity, selectedVariants, unitPriceCents: priceWithVariants(item, selectedVariants) };
        })
        .filter((e): e is CartEntry => e !== null),
    [quantities, itemsById, variantSelections]
  );

  const totalCount = entries.reduce((sum, e) => sum + e.quantity, 0);
  const totalCents = entries.reduce((sum, e) => sum + e.unitPriceCents * e.quantity, 0);

  function setQuantity(itemId: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  }

  function quickAdd(itemId: string) {
    setQuantities((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  }

  function setVariantChoice(itemId: string, groupKey: string, value: string) {
    setVariantSelections((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [groupKey]: value } }));
  }

  function clear() {
    setQuantities({});
    setVariantSelections({});
  }

  const value: CartContextValue = {
    entries,
    totalCount,
    totalCents,
    quantityOf: (itemId) => quantities[itemId] ?? 0,
    setQuantity,
    quickAdd,
    setVariantChoice,
    variantsFor: (item) => defaultVariants(item, variantSelections[item.id]),
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
