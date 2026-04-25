import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const session = event.data.object;
    const customerEmail =
      session.customer_email ||
      session.customer_details?.email ||
      (await stripe.customers.retrieve(session.customer)).email;

    if (!customerEmail) {
      return res.status(400).json({ error: "No customer email" });
    }

    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [customerEmail],
      });

      if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = users[0];

      await clerkClient.users.updateUserMetadata(user.id, {
        publicMetadata: {
          isPro: true,
          stripeCustomerId: session.customer,
          plan: session.amount_total <= 1500 ? "personal" : "professional",
        },
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);

    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [customer.email],
      });

      if (users.length > 0) {
        await clerkClient.users.updateUserMetadata(users[0].id, {
          publicMetadata: {
            isPro: false,
            plan: "free",
          },
        });
      }
    } catch (err) {
      console.error("Clerk downgrade error:", err.message);
    }
  }

  return res.status(200).json({ received: true });
}
