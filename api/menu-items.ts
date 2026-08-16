import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapMenuItem } from "./_db.js";
import { methodNotAllowed } from "./_http.js";
import { requireDashboardAuth } from "./_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const restaurantId = typeof req.query.restaurantId === "string" ? req.query.restaurantId : undefined;
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }
    const { rows } = categoryId
      ? await sql`
          SELECT * FROM menu_items
          WHERE restaurant_id = ${restaurantId} AND category_id = ${categoryId}
          ORDER BY sort_order ASC, name ASC
        `
      : await sql`
          SELECT * FROM menu_items WHERE restaurant_id = ${restaurantId} ORDER BY sort_order ASC, name ASC
        `;
    return res.status(200).json(rows.map(mapMenuItem));
  }

  if (req.method === "POST") {
    if (!requireDashboardAuth(req, res)) return;
    const {
      restaurantId,
      categoryId,
      name,
      description,
      imageUrl,
      priceCents,
      needsPricing,
      isAvailable,
      sortOrder,
      translations,
      foodGuideTags,
      variantOptions,
    } = req.body ?? {};
    if (!restaurantId || !categoryId || !name || typeof priceCents !== "number") {
      return res.status(400).json({ error: "restaurantId, categoryId, name, and priceCents are required" });
    }
    const { rows } = await sql`
      INSERT INTO menu_items (
        restaurant_id, category_id, name, description, image_url, price_cents, needs_pricing,
        is_available, sort_order, translations, food_guide_tags, variant_options
      )
      VALUES (
        ${restaurantId}, ${categoryId}, ${name}, ${description ?? null}, ${imageUrl ?? null},
        ${priceCents}, ${needsPricing ?? false},
        ${isAvailable ?? true}, ${sortOrder ?? 0}, ${JSON.stringify(translations ?? {})},
        ${foodGuideTags ?? []}, ${JSON.stringify(variantOptions ?? [])}
      )
      RETURNING *
    `;
    return res.status(201).json(mapMenuItem(rows[0]));
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
