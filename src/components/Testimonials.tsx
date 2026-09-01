"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Verdadeira obra de arte, criada com tanta delicadeza e riqueza de detalhes. Cada traço revela o carinho, a dedicação e o talento impecável do trabalho da Canto e Cor. Simplesmente encantada e imensamente grata por receber uma peça tão linda e feita com tanta perfeição!",
    author: "Cliente Canto e Cor",
  },
  {
    quote: "Simplesmente perfeito!",
    author: "Cliente Canto e Cor",
  },
  {
    quote: "Tá perfeito! Eu sabia que você ia arrasar... todos amamos! Meu pai ficou impactado.",
    author: "Cliente Canto e Cor",
  },
  {
    quote: "Estou encantada pela pintura, amei muito!",
    author: "Cliente Canto e Cor",
  },
  {
    quote: "Oi diva, estou emocionada!! Ficou maravilhoso, você arrasa demais, que talento!",
    author: "Cliente Canto e Cor",
  },
  {
    quote: "Ficou muito lindo, Lívia, de coração muito obrigada! E parabéns também.",
    author: "Cliente Canto e Cor",
  },
];

const INTERVAL_MS = 2500;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const current = TESTIMONIALS[index];

  return (
    <section className="bg-accent text-white">
      <div className="mx-auto flex min-h-[20rem] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <p
          key={index}
          className="font-serif-display text-2xl leading-relaxed opacity-0 [animation:fade-in_0.5s_ease-out_forwards] md:text-3xl"
        >
          &ldquo;{current.quote}&rdquo;
        </p>
        <p
          key={`${index}-author`}
          className="mt-6 text-xs tracking-[0.2em] uppercase opacity-0 [animation:fade-in_0.5s_ease-out_forwards]"
        >
          {current.author}
        </p>

        <div className="mt-10 flex items-center gap-4">
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver depoimento ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Continuar depoimentos" : "Pausar depoimentos"}
            className="flex h-6 w-6 items-center justify-center text-white/70 hover:text-white"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
