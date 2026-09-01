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
            O Canto e Cor nasceu da vontade de transformar fotos e memórias em
            aquarelas únicas, pintadas à mão e feitas especialmente para cada
            história.
          </p>
          <p className="mt-4 text-foreground/80">
            Além das aquarelas, a página também é um espaço onde compartilho meus
            projetos, processos criativos e um pouco do meu dia a dia como estudante
            de Arquitetura.
          </p>
          <p className="mt-4 text-foreground/80">
            As aquarelas podem ser feitas nos formatos A5, A4 ou em tamanho
            personalizado. Cada peça é produzida individualmente e o valor varia
            conforme o tamanho e a complexidade do desenho.
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
                Sou a Lívia, estudante de Arquitetura e apaixonada por tudo que
                envolve arte, criação e expressão.
              </p>
              <p>
                Desde pequena, muito influenciada pelo meu avô, desenvolvi uma
                relação próxima com o universo artístico, passando por diferentes
                técnicas como desenho, pintura e aquarela. Foi também esse olhar
                criativo que me levou à Arquitetura, onde encontrei uma nova forma
                de transformar ideias em experiências.
              </p>
              <p>
                O Canto e Cor nasceu como uma extensão desse caminho: um espaço
                onde arte, arquitetura e cotidiano se encontram.
              </p>
            </div>
          </div>
          <RandomPortrait />
        </div>
      </section>
    </div>
  );
}
