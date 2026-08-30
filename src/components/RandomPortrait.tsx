"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const PORTRAITS = [
  "/sobre/livia-1.webp",
  "/sobre/livia-2.webp",
  "/sobre/livia-3.webp",
  "/sobre/livia-4.webp",
];

export default function RandomPortrait() {
  const [src, setSrc] = useState(PORTRAITS[0]);

  useEffect(() => {
    // Deliberately client-only: picking here (not in the initial state) avoids
    // a server/client hydration mismatch, since the random pick can't match
    // what the server rendered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(PORTRAITS[Math.floor(Math.random() * PORTRAITS.length)]);
  }, []);

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface">
      <Image
        src={src}
        alt="Lívia, do Ateliê Canto e Cor"
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
