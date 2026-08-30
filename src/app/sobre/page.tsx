import type { Metadata } from "next";
import PortfolioCarousel from "@/components/PortfolioCarousel";
import RandomPortrait from "@/components/RandomPortrait";
import { LinkButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Sobre | Canto e Cor",
  description: "Conheça o Ateliê Canto e Cor e o processo por trás de cada aquarela personalizada.",
};

export default function SobrePage() {
  return (
    <div>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Sobre</p>
          <h1 className="font-serif-display text-4xl text-foreground">O Ateliê Canto e Cor</h1>
          <p className="mt-6 text-foreground/80">
            O Canto e Cor nasceu da vontade de transformar fotos e memórias em peças
            únicas, pintadas à mão em aquarela. Cada encomenda começa com a sua
            história: um casal, um pet, um retrato querido ou uma homenagem a alguém
            especial.
          </p>
          <p className="mt-4 text-foreground/80">
            Trabalhamos com papéis de qualidade em dois tamanhos, A5 e A4, e cada peça é
            pintada individualmente &mdash; sem réplicas, sem produção em série. O valor
            pode variar conforme o tamanho do papel e a complexidade do desenho.
          </p>
          <div className="mt-8">
            <LinkButton href="/pedido">Fazer minha encomenda</LinkButton>
          </div>
        </div>
        <PortfolioCarousel />
      </div>

      <section className="border-t border-border bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Quem pinta</p>
            <h2 className="font-serif-display text-3xl text-foreground">
              Um pouco sobre a Lívia
            </h2>
            <div className="mt-6 space-y-4 text-foreground/80">
              <p>
                Sou estudante de arquitetura, e foi dentro do curso que descobri a
                aquarela como um jeito de reinventar e amadurecer a minha criatividade.
                Não foi um caminho fácil &mdash; é uma jornada trabalhosa, mas que vale
                muito a pena.
              </p>
              <p>
                No meio disso, conheci pessoas incríveis e aprendi coisas que nunca
                imaginei ter contato. E com certeza a minha maior meta como profissional
                é realizar sonhos de futuros clientes, principalmente aqueles que não têm
                acesso ao mundo arquitetônico &mdash; e é um pouco desse espírito que
                trago para o Canto e Cor: tornar uma peça de arte personalizada e feita à
                mão algo acessível para quem quiser eternizar a sua história.
              </p>
            </div>
          </div>
          <RandomPortrait />
        </div>
      </section>
    </div>
  );
}
