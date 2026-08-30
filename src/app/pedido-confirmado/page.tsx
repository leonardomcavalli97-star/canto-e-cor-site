import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";
import { checkInfinitePayPayment } from "@/lib/infinitepay";
import { getOrder, updateOrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Encomenda confirmada | Canto e Cor",
};

export default async function PedidoConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{
    order_id?: string;
    order_nsu?: string;
    transaction_nsu?: string;
    slug?: string;
  }>;
}) {
  const { order_id, order_nsu, transaction_nsu, slug } = await searchParams;
  const orderId = order_nsu ?? order_id;

  if (orderId && transaction_nsu && slug) {
    const order = await getOrder(orderId);
    if (order && order.status !== "paid" && order.status !== "shipped") {
      try {
        const { paid } = await checkInfinitePayPayment({
          orderNsu: orderId,
          transactionNsu: transaction_nsu,
          slug,
        });
        if (paid) {
          await updateOrderStatus(orderId, "paid", transaction_nsu);
        }
      } catch {
        // O webhook da InfinitePay ainda pode confirmar o pagamento depois.
      }
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Pagamento recebido</p>
      <h1 className="font-serif-display text-4xl text-foreground">
        Sua encomenda está confirmada!
      </h1>
      <p className="mt-6 text-foreground/80">
        Obrigada por encomendar sua aquarela no Canto e Cor. Vamos entrar em contato
        pelo e-mail ou WhatsApp informado em breve para dar início à pintura.
      </p>
      <div className="mt-10">
        <LinkButton href="/">Voltar para o início</LinkButton>
      </div>
    </div>
  );
}
