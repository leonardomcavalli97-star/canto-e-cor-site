"use client";

import { useEffect, useState } from "react";
import ArtworkCard from "@/components/ArtworkCard";

export type ThemeGroup = {
  key: string;
  label: string;
  options: string[];
};

export default function ThemeShowcase({ themes }: { themes: ThemeGroup[] }) {
  const [srcs, setSrcs] = useState(() => themes.map((theme) => theme.options[0]));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only randomization to avoid an SSR/CSR mismatch
    setSrcs(themes.map((theme) => theme.options[Math.floor(Math.random() * theme.options.length)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {themes.map((theme, i) => (
        <ArtworkCard key={theme.key} src={srcs[i]} alt={theme.label} label={theme.label} />
      ))}
    </div>
  );
}
