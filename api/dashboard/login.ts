import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed } from "../_http.js";
import { checkPassword, createSessionCookie } from "../_auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const { password } = req.body ?? {};
  if (typeof password !== "string" || !checkPassword(password)) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  return res.status(200).json({ authenticated: true });
}
