import { useCallback, useState, type FormEvent } from "react";
import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  getCategories,
  getMenuItems,
  updateMenuItem,
} from "../../lib/api";
import { usePolling } from "../../lib/usePolling";
import { formatPrice } from "../../lib/format";

export default function MenuPanel() {
  const categoriesFetcher = useCallback(() => getCategories(), []);
  const itemsFetcher = useCallback(() => getMenuItems(), []);
  const { data: categories, error: categoriesError, refetch: refetchCategories } = usePolling(
    categoriesFetcher,
    5000
  );
  const { data: items, error: itemsError, refetch: refetchItems } = usePolling(itemsFetcher, 5000);

  const [categoryName, setCategoryName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Record<string, { name: string; description: string; price: string }>>({});

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setFormError(null);
    try {
      await createCategory({ name: categoryName.trim() });
      setCategoryName("");
      refetchCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create category");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm("Delete this category and all its items?")) return;
    try {
      await deleteCategory(id);
      refetchCategories();
      refetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete category");
    }
  }

  function updateDraft(categoryId: string, field: "name" | "description" | "price", value: string) {
    setNewItem((prev) => {
      const current = prev[categoryId] ?? { name: "", description: "", price: "" };
      return { ...prev, [categoryId]: { ...current, [field]: value } };
    });
  }

  async function handleAddItem(categoryId: string, e: FormEvent) {
    e.preventDefault();
    const draft = newItem[categoryId];
    const priceCents = Math.round(Number(draft?.price ?? "0") * 100);
    if (!draft?.name?.trim() || !priceCents || priceCents <= 0) {
      setFormError("Item name and a positive price are required");
      return;
    }
    setFormError(null);
    try {
      await createMenuItem({
        categoryId,
        name: draft.name.trim(),
        description: draft.description?.trim() || undefined,
        priceCents,
      });
      setNewItem((prev) => ({ ...prev, [categoryId]: { name: "", description: "", price: "" } }));
      refetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create item");
    }
  }

  async function toggleAvailability(itemId: string, isAvailable: boolean) {
    try {
      await updateMenuItem(itemId, { isAvailable: !isAvailable });
      refetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update item");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteMenuItem(itemId);
      refetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete item");
    }
  }

  return (
    <div>
      <form className="form-row" onSubmit={handleAddCategory}>
        <input
          placeholder="New category (e.g. Appetizers)"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
        <button type="submit">Add category</button>
      </form>

      {(formError || categoriesError || itemsError) && (
        <div className="error-banner">{formError ?? categoriesError ?? itemsError}</div>
      )}

      {!categories || categories.length === 0 ? (
        <p className="empty-state">No menu categories yet.</p>
      ) : (
        categories.map((category) => {
          const categoryItems = items?.filter((i) => i.categoryId === category.id) ?? [];
          const draft = newItem[category.id] ?? { name: "", description: "", price: "" };
          return (
            <section className="category-block" key={category.id}>
              <div className="table-card-header">
                <h3>{category.name}</h3>
                <button type="button" onClick={() => handleDeleteCategory(category.id)}>
                  Delete category
                </button>
              </div>

              {categoryItems.map((item) => (
                <div className={`item-row ${item.isAvailable ? "" : "unavailable"}`} key={item.id}>
                  <div className="item-info">
                    <strong>{item.name}</strong> — {formatPrice(item.priceCents)}
                    {item.description && <div className="item-desc">{item.description}</div>}
                  </div>
                  <div className="order-actions">
                    <button type="button" onClick={() => toggleAvailability(item.id, item.isAvailable)}>
                      {item.isAvailable ? "Mark 86'd" : "Mark available"}
                    </button>
                    <button type="button" onClick={() => handleDeleteItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <form className="form-row" onSubmit={(e) => handleAddItem(category.id, e)}>
                <input
                  placeholder="Item name"
                  value={draft.name}
                  onChange={(e) => updateDraft(category.id, "name", e.target.value)}
                />
                <input
                  placeholder="Description"
                  value={draft.description}
                  onChange={(e) => updateDraft(category.id, "description", e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={draft.price}
                  onChange={(e) => updateDraft(category.id, "price", e.target.value)}
                  style={{ maxWidth: 100 }}
                />
                <button type="submit">Add item</button>
              </form>
            </section>
          );
        })
      )}
    </div>
  );
}
