import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Encomenda confirmada | Canto e Cor",
};

export default function PedidoConfirmadoPage() {
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
