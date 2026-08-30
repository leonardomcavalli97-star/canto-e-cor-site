import type { Metadata } from "next";
import ArtworkCard from "@/components/ArtworkCard";
import { LinkButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Galeria | Canto e Cor",
  description: "Trabalhos autorais do Ateliê Canto e Cor: casais, pets, retratos e homenagens em aquarela.",
};

const PIECES = [
  { src: "/gallery/nossa-senhora-oracao.webp", label: "Nossa Senhora" },
  { src: "/gallery/sao-jorge.webp", label: "São Jorge" },
  { src: "/gallery/honey.webp", label: "Honey" },
  { src: "/gallery/nossa-senhora-fatima.webp", label: "Nossa Senhora de Fátima" },
  { src: "/gallery/sao-patricio.webp", label: "São Patrício" },
  { src: "/gallery/jade.webp", label: "Jade" },
  { src: "/gallery/nina.webp", label: "Nina" },
  { src: "/gallery/cachorro-anjo.webp", label: "Homenagem a um pet" },
];

export default function GaleriaPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Galeria</p>
      <h1 className="font-serif-display text-4xl text-foreground">Trabalhos do ateliê</h1>
      <p className="mt-4 max-w-xl text-foreground/70">
        Uma seleção de peças pintadas pelo Canto e Cor.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PIECES.map((piece) => (
          <ArtworkCard key={piece.src} src={piece.src} alt={piece.label} label={piece.label} />
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-foreground/70">Gostou do que viu?</p>
        <div className="mt-4">
          <LinkButton href="/pedido">Encomendar a minha</LinkButton>
        </div>
      </div>
    </div>
  );
}
