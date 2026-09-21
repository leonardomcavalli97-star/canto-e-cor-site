import type { Metadata } from "next";
import PaymentCheckout from "@/components/PaymentCheckout";

export const metadata: Metadata = {
  title: "Pagamento | Canto e Cor",
};

export default async function PedidoPagamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Pagamento</p>
      <h1 className="font-serif-display text-4xl text-foreground">
        Falta só o pagamento
      </h1>
      <p className="mt-4 text-foreground/80">
        Sua encomenda já foi registrada. Finalize o pagamento para começarmos a pintar.
      </p>

      {orderId ? (
        <PaymentCheckout orderId={orderId} />
      ) : (
        <p className="mt-10 text-sm text-accent">Pedido não encontrado.</p>
      )}
    </div>
  );
}
