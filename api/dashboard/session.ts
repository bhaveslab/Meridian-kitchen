import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed } from "../_http.js";
import { isAuthenticated } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  return res.status(200).json({ authenticated: isAuthenticated(req) });
}
