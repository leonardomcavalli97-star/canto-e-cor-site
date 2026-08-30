import type { Metadata } from "next";
import OrderForm from "@/components/OrderForm";

export const metadata: Metadata = {
  title: "Fazer encomenda | Canto e Cor",
  description:
    "Encomende sua aquarela personalizada: escolha o tamanho, envie a foto de referência e pague direto pelo site.",
};

export default function PedidoPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Encomenda</p>
        <h1 className="font-serif-display text-4xl text-foreground">
          Vamos pintar a sua aquarela
        </h1>
        <p className="mt-4 text-foreground/70">
          Preencha os campos abaixo com o tamanho desejado, uma foto de referência e uma
          breve descrição. No final você será direcionado(a) para o pagamento.
        </p>
      </div>

      <OrderForm />
    </div>
  );
}
