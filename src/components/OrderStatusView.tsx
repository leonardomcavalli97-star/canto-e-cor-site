"use client";

import { useEffect, useState } from "react";

type StatusData = {
  name: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  items: { size: string; theme: string; quantity: number }[];
  totalPriceCents: number | null;
  totalPriceLabel: string;
  paidAt: string | null;
  rushDays: number | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function OrderStatusView({ orderId }: { orderId: string }) {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${orderId}/status`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError("Não encontramos esse pedido. Confira se o código está certo.");
          return;
        }
        setData(await res.json());
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível consultar agora. Tente novamente em instantes.");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) {
    return <p className="mt-10 text-sm text-accent">{error}</p>;
  }

  if (!data) {
    return <p className="mt-10 text-sm text-muted">Consultando...</p>;
  }

  let deadline: Date | null = null;
  if (data.rushDays !== null) {
    deadline = new Date(data.paidAt ?? data.createdAt);
    deadline.setDate(deadline.getDate() + data.rushDays);
  }

  return (
    <div className="mt-10 border border-border bg-surface p-6 text-left">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Status</p>
      <p className="mt-1 font-serif-display text-2xl text-accent">{data.statusLabel}</p>

      <div className="mt-5 space-y-1 border-t border-border pt-4 text-sm text-foreground/80">
        <p>Pedido feito em {formatDate(data.createdAt)}</p>
        {data.paidAt && <p>Pagamento confirmado em {formatDate(data.paidAt)}</p>}
        {deadline && <p>Previsão de conclusão: {formatDate(deadline.toISOString())}</p>}
      </div>

      <div className="mt-5 space-y-1 border-t border-border pt-4 text-sm text-foreground/80">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {data.items.length > 1 ? "Desenhos" : "Desenho"}
        </p>
        {data.items.map((item, i) => (
          <p key={i}>
            {item.size} · {item.theme} · Qtd {item.quantity}
          </p>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm text-foreground/70">Total</span>
        <span className="font-serif-display text-xl text-accent">{data.totalPriceLabel}</span>
      </div>
    </div>
  );
}
