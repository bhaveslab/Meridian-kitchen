import type { VercelResponse } from "@vercel/node";

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: `Method not allowed. Allowed: ${allowed.join(", ")}` });
}

// generalstore.html (wholelisticlyfe.com) calls this app's API
// (order.wholelisticlyfe.com) cross-origin — everything else served by
// this app is same-origin (its own React storefront/dashboard), so this
// is the one legitimate cross-origin caller. Scoped to that exact origin
// rather than "*" since these endpoints handle real customer data and
// Stripe checkout.
const STORE_ORIGIN = "https://wholelisticlyfe.com";

export function setCorsHeaders(res: VercelResponse, methods: string[]) {
  res.setHeader("Access-Control-Allow-Origin", STORE_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", [...methods, "OPTIONS"].join(", "));
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
