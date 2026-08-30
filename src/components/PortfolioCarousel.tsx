"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

const INTERVAL_MS = 4000;

export default function PortfolioCarousel({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PIECES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const current = PIECES[index];

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden bg-surface ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Image
        key={index}
        src={current.src}
        alt={current.label}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-contain p-3 opacity-0 [animation:fade-in_0.6s_ease-out_forwards]"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-serif-display text-sm text-foreground/70">
        {current.label}
      </span>
      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-2">
        {PIECES.map((piece, i) => (
          <button
            key={piece.src}
            type="button"
            aria-label={`Ver ${piece.label}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-accent" : "w-1.5 bg-foreground/25"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
