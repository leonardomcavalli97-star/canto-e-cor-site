import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Pagamento não concluído | Canto e Cor",
};

export default function PedidoCanceladoPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Pagamento não concluído</p>
      <h1 className="font-serif-display text-4xl text-foreground">
        O pagamento foi cancelado
      </h1>
      <p className="mt-6 text-foreground/80">
        Seus dados e foto de referência foram salvos, mas o pagamento não foi
        finalizado. Você pode tentar novamente quando quiser.
      </p>
      <div className="mt-10">
        <LinkButton href="/pedido">Tentar novamente</LinkButton>
      </div>
    </div>
  );
}
