import type { IncomingMessage } from "http";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { sql } from "../_db";
import { getStripe } from "../_stripe";
import { methodNotAllowed } from "../_http";

// Stripe signature verification needs the exact raw request bytes, so the
// platform's default JSON body parsing has to be turned off for this route.
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured" });
  }

  const stripe = getStripe();
  const rawBody = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
      await sql`
        UPDATE orders
        SET payment_status = 'paid', stripe_payment_intent_id = ${paymentIntentId}, updated_at = now()
        WHERE id = ${orderId}
      `;
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await sql`
        UPDATE orders
        SET payment_status = 'failed', status = 'cancelled', updated_at = now()
        WHERE id = ${orderId} AND payment_status = 'pending'
      `;
    }
  }

  return res.status(200).json({ received: true });
}
