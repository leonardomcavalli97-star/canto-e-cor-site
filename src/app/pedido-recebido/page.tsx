import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Pedido recebido | Canto e Cor",
};

export default function PedidoRecebidoPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Pedido recebido</p>
      <h1 className="font-serif-display text-4xl text-foreground">
        Recebemos o seu pedido personalizado!
      </h1>
      <p className="mt-6 text-foreground/80">
        Como o tamanho é personalizado, ainda não cobramos nada. Vamos analisar os
        detalhes e enviar um orçamento pelo e-mail ou WhatsApp informado — o pagamento
        só acontece depois que você aprovar o valor.
      </p>
      <div className="mt-10">
        <LinkButton href="/">Voltar para o início</LinkButton>
      </div>
    </div>
  );
}
