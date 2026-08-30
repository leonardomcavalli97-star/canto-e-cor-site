import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Contato | Canto e Cor",
  description: "Fale com o Ateliê Canto e Cor pelo Instagram ou e-mail.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Contato</p>
      <h1 className="font-serif-display text-4xl text-foreground">Vamos conversar</h1>
      <p className="mt-6 text-foreground/80">
        Quer encomendar uma aquarela? O jeito mais rápido é preencher o formulário de
        encomenda, com sua foto de referência e o tamanho desejado. Dúvidas antes disso
        podem vir por aqui:
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 text-lg">
        <a
          href="https://www.instagram.com/cantoecoratelie/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-dark"
        >
          @cantoecoratelie no Instagram
        </a>
      </div>

      <div className="mt-12">
        <LinkButton href="/pedido">Ir para o formulário de encomenda</LinkButton>
      </div>
    </div>
  );
}
