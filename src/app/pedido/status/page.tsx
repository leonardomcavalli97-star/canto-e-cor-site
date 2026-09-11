import type { Metadata } from "next";
import OrderStatusLookupForm from "@/components/OrderStatusLookupForm";

export const metadata: Metadata = {
  title: "Acompanhar pedido | Canto e Cor",
  description: "Consulte o status da sua encomenda de aquarela personalizada.",
};

export default function OrderStatusLookupPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Acompanhar pedido</p>
      <h1 className="font-serif-display text-4xl text-foreground">Como está minha encomenda?</h1>
      <p className="mt-4 text-foreground/70">
        Cole o código do pedido que você recebeu por e-mail assim que fez a encomenda.
      </p>
      <OrderStatusLookupForm />
    </div>
  );
}
