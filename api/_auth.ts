// Single shared-password gate for /dashboard/:slug and its mutating API
// routes (v1: one restaurant, so one password rather than per-user
// accounts — see README for the tradeoffs). The session cookie is a
// timestamp signed with an HMAC keyed on DASHBOARD_PASSWORD, so no
// sessions table is needed; anyone holding the correct password can issue
// themselves a valid cookie, which is exactly the v1 threat model.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "dashboard_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getPassword(): string {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    throw new Error("DASHBOARD_PASSWORD is not set");
  }
  return password;
}

function sign(payload: string): string {
  return createHmac("sha256", getPassword()).update(payload).digest("hex");
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function createSessionCookie(): string {
  const payload = String(Date.now() + SESSION_TTL_MS);
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function isAuthenticated(req: VercelRequest): boolean {
  const value = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!value) return false;
  const dot = value.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = sign(payload);
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function checkPassword(candidate: string): boolean {
  const password = getPassword();
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireDashboardAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (isAuthenticated(req)) return true;
  res.status(401).json({ error: "Not authenticated" });
  return false;
}
