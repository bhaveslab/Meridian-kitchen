import { useState, type FormEvent } from "react";
import { FOOD_GUIDE_CATEGORIES, type FoodGuideCategoryKey } from "../../../shared/foodGuide";
import type { MenuItem, Translations, VariantOption } from "../../../shared/types";

interface Props {
  item: MenuItem;
  onSave: (updates: {
    name: string;
    description: string;
    imageUrl: string;
    priceCents: number;
    needsPricing: boolean;
    translations: Translations;
    foodGuideTags: FoodGuideCategoryKey[];
    variantOptions: VariantOption[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ItemEditForm({ item, onSave, onCancel }: Props) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [nameEs, setNameEs] = useState(item.translations.es?.name ?? "");
  const [descriptionEs, setDescriptionEs] = useState(item.translations.es?.description ?? "");
  const [price, setPrice] = useState((item.priceCents / 100).toFixed(2));
  const [needsPricing, setNeedsPricing] = useState(item.needsPricing);
  const [tags, setTags] = useState<Set<FoodGuideCategoryKey>>(new Set(item.foodGuideTags));
  const [variantOptionsJson, setVariantOptionsJson] = useState(JSON.stringify(item.variantOptions, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleTag(key: FoodGuideCategoryKey) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let variantOptions: VariantOption[];
    try {
      variantOptions = JSON.parse(variantOptionsJson);
    } catch {
      setError("Variant options must be valid JSON");
      return;
    }
    const priceCents = Math.round(Number(price) * 100);
    if (!name.trim() || !priceCents || priceCents <= 0) {
      setError("Name and a positive price are required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        priceCents,
        needsPricing,
        translations: {
          es: {
            name: nameEs.trim() || undefined,
            description: descriptionEs.trim() || undefined,
          },
        },
        foodGuideTags: Array.from(tags),
        variantOptions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem", margin: "0.5rem 0" }}>
      <div className="form-row">
        <input placeholder="Name (EN)" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Nombre (ES)" value={nameEs} onChange={(e) => setNameEs(e.target.value)} />
      </div>
      <div className="form-row">
        <input
          placeholder="Description (EN)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="Descripción (ES)"
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
        />
      </div>
      <div className="form-row">
        <input
          placeholder="Image URL (e.g. /menu-photos/dish.jpg)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ flexBasis: "100%" }}
        />
      </div>
      <div className="form-row">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Price (USD)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ maxWidth: 100 }}
        />
        <label>
          <input type="checkbox" checked={needsPricing} onChange={(e) => setNeedsPricing(e.target.checked)} />{" "}
          Needs pricing
        </label>
      </div>
      <div className="form-row" style={{ flexWrap: "wrap" }}>
        {FOOD_GUIDE_CATEGORIES.map((cat) => (
          <label key={cat.key} style={{ minWidth: "auto" }}>
            <input type="checkbox" checked={tags.has(cat.key)} onChange={() => toggleTag(cat.key)} />{" "}
            {cat.labelEn}
          </label>
        ))}
      </div>
      <div className="form-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <label htmlFor={`variants-${item.id}`} style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          Variant options (JSON — e.g. serving style choices)
        </label>
        <textarea
          id={`variants-${item.id}`}
          rows={4}
          value={variantOptionsJson}
          onChange={(e) => setVariantOptionsJson(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: "0.8rem" }}
        />
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="order-actions">
        <button type="submit" disabled={saving}>
          Save
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
