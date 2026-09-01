import type { Metadata } from "next";
import PixCheckout from "@/components/PixCheckout";

export const metadata: Metadata = {
  title: "Pagar com Pix | Canto e Cor",
};

export default async function PedidoPixPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Pagamento via Pix</p>
      <h1 className="font-serif-display text-4xl text-foreground">
        Falta só o pagamento
      </h1>
      <p className="mt-4 text-foreground/80">
        Sua encomenda já foi registrada. Pague o valor exato abaixo para confirmarmos.
      </p>
      <p className="mt-2 text-sm text-foreground/60">
        A confirmação é feita manualmente e pode levar até 24 horas — você não
        precisa esperar nesta página. Assim que confirmarmos, avisamos por e-mail.
      </p>

      {orderId ? (
        <PixCheckout orderId={orderId} />
      ) : (
        <p className="mt-10 text-sm text-accent">Pedido não encontrado.</p>
      )}
    </div>
  );
}
