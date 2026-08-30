import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY não configurada. Adicione sua chave no arquivo .env.local (veja .env.example)."
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}
