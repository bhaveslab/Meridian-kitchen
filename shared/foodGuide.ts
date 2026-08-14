// The WLV Electric Foods Guide categories menu items are tagged against.
// This is a fixed brand taxonomy, not restaurant-editable data, so it lives
// as a constant rather than a database table.

export type FoodGuideCategoryKey =
  | "vegetables"
  | "fruits"
  | "grains"
  | "nuts_and_seeds"
  | "oils"
  | "herbs_and_spices"
  | "sweeteners"
  | "herbal_teas"
  | "alkaline_water";

export interface FoodGuideCategory {
  key: FoodGuideCategoryKey;
  labelEn: string;
  labelEs: string;
}

export const FOOD_GUIDE_CATEGORIES: FoodGuideCategory[] = [
  { key: "vegetables", labelEn: "Vegetables", labelEs: "Vegetales" },
  { key: "fruits", labelEn: "Fruits", labelEs: "Frutas" },
  { key: "grains", labelEn: "Grains", labelEs: "Granos" },
  { key: "nuts_and_seeds", labelEn: "Nuts & Seeds", labelEs: "Nueces y Semillas" },
  { key: "oils", labelEn: "Oils", labelEs: "Aceites" },
  { key: "herbs_and_spices", labelEn: "Herbs & Spices", labelEs: "Hierbas y Especias" },
  { key: "sweeteners", labelEn: "Sweeteners", labelEs: "Endulzantes" },
  { key: "herbal_teas", labelEn: "Herbal Teas", labelEs: "Tés de Hierbas" },
  { key: "alkaline_water", labelEn: "Alkaline Water", labelEs: "Agua Alcalina" },
];

export const FOOD_GUIDE_CATEGORY_KEYS: FoodGuideCategoryKey[] = FOOD_GUIDE_CATEGORIES.map((c) => c.key);
