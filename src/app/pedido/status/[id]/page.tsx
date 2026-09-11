import type { Metadata } from "next";
import OrderStatusView from "@/components/OrderStatusView";

export const metadata: Metadata = {
  title: "Acompanhar pedido | Canto e Cor",
  description: "Consulte o status da sua encomenda de aquarela personalizada.",
};

export default async function OrderStatusPage(props: PageProps<"/pedido/status/[id]">) {
  const { id } = await props.params;

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Acompanhar pedido</p>
      <h1 className="font-serif-display text-4xl text-foreground">Como está minha encomenda?</h1>
      <OrderStatusView orderId={id} />
    </div>
  );
}
