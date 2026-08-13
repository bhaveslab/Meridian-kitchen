import type { VercelResponse } from "@vercel/node";

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: `Method not allowed. Allowed: ${allowed.join(", ")}` });
}
