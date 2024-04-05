// const express = require("express");
import Stripe from "stripe";
const stripe = new Stripe(
  "sk_test_51P0KfySGisJCwj2A5UbEWIhgDnTxIquO13ie7zlbNHFyYOSja8ccQDTU44RZ1wN7cq5bEIFGLtkRoq3d2msBeTvM00hBjml0wu"
);
// const bodyParser = require("body-parser");
// const app = express();
// app.use(bodyParser.json());

export const subscriptionPayment = async (req, res) => {
  // console.log("subscription", req.body);
  const { plan } = req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "subscription_plan",
          },
          unit_amount: plan === "silver" ? 10000 : 100000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:3000/AskQuestion",
    cancel_url: "http://localhost:3000",
  });
  console.log(session);
  return res.json({ id: session.id });
};

export const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      "your_stripe_webhook_secret"
    );
  } catch (err) {
    console.error(err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      // Handle successful payment
      console.log("Payment succeeded:", session.id);
      break;
    case "checkout.session.failed":
      // Handle failed payment
      console.log("Payment failed:", event);
      break;
    // Add more cases for other types of events if needed
    default:
      // Unexpected event type
      console.log("Unhandled event type:", event.type);
  }

  res.json({ received: true });
};
