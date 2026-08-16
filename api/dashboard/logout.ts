import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed } from "../_http.js";
import { clearSessionCookie } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ authenticated: false });
}
