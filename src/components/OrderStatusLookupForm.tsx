"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function OrderStatusLookupForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;
    router.push(`/pedido/status/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        placeholder="Cole aqui o código do seu pedido"
        className="w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
      />
      <Button type="submit" className="shrink-0">
        Consultar
      </Button>
    </form>
  );
}
