import { LinkButton } from "@/components/Button";
import ArtworkCard from "@/components/ArtworkCard";
import Testimonials from "@/components/Testimonials";

const STEPS = [
  {
    number: "01",
    title: "Sua ideia",
    text: "Escolha o que você quer transformar em aquarela. Pode ser uma pessoa, um casal, um pet, uma viagem, uma casa, um lugar especial ou qualquer outra ideia que tenha significado para você.",
  },
  {
    number: "02",
    title: "Faça seu pedido",
    text: "Personalize sua encomenda diretamente pelo site: escolha o tamanho, envie suas fotos de referência e informe os detalhes do desenho. Todo o pedido pode ser feito por aqui, de forma simples e rápida.",
  },
  {
    number: "03",
    title: "Receba sua aquarela",
    text: "Sua aquarela é pintada à mão, preparada com todo cuidado e enviada para chegar até você pronta para guardar, presentear ou decorar.",
  },
];

const THEMES = [
  { key: "pet", label: "Pets", src: "/gallery/jade.webp" },
  { key: "santos", label: "Santos", src: "/gallery/sao-jorge.webp" },
  { key: "devocional", label: "Devocionais", src: "/gallery/nossa-senhora-oracao.webp" },
  { key: "homenagem", label: "Homenagens", src: "/gallery/cachorro-anjo.webp" },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pt-16 pb-20 md:grid-cols-2 md:items-center md:pt-24">
        <div>
          <p className="mb-4 text-xs tracking-[0.2em] text-accent uppercase">
            Ateliê de aquarela personalizada
          </p>
          <h1 className="font-serif-display text-4xl leading-tight text-foreground md:text-5xl">
            Sua história, pintada à mão em aquarela
          </h1>
          <p className="mt-6 max-w-md text-foreground/80">
            No Canto e Cor transformamos a sua foto em uma aquarela original: casais,
            pets, retratos e homenagens, pintados um a um, com carinho, a partir da
            imagem que você enviar.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <LinkButton href="/pedido">Fazer minha encomenda</LinkButton>
            <LinkButton href="/galeria" variant="outline">Ver galeria</LinkButton>
          </div>
        </div>
        <ArtworkCard
          src="/gallery/nossa-senhora-oracao.webp"
          alt="Aquarela de Nossa Senhora, pintada pelo Ateliê Canto e Cor"
          priority
        />
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif-display text-center text-3xl text-foreground">
            Como funciona
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <span className="font-serif-display text-4xl text-accent/40">
                  {step.number}
                </span>
                <h3 className="mt-3 font-serif-display text-xl text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-foreground/70">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-serif-display text-center text-3xl text-foreground">
          O que pintamos
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-foreground/70">
          Cada tema pede um olhar diferente — escolha o que mais combina com a sua
          encomenda.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {THEMES.map((theme) => (
            <ArtworkCard key={theme.key} src={theme.src} alt={theme.label} label={theme.label} />
          ))}
        </div>
      </section>

      <Testimonials />

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-serif-display text-3xl text-foreground">
          Pronto para eternizar seu momento?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-foreground/70">
          Preencha o formulário de encomenda com sua foto de referência e o tamanho
          desejado. O pagamento é feito direto pelo site.
        </p>
        <div className="mt-8">
          <LinkButton href="/pedido">Começar minha encomenda</LinkButton>
        </div>
      </section>
    </div>
  );
}
