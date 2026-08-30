"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/pricing";

type OrderItem = {
  paperSize: string;
  theme: string;
  description: string;
  quantity: number;
  unitPriceCents: number | null;
};

type Order = {
  id: string;
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  totalPriceCents: number | null;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pix_pending: "Aguardando Pix",
  pending_payment: "Aguardando cartão",
  pending_quote: "Aguardando orçamento",
  paid: "Pago",
  cancelled: "Cancelado",
};

function OrderCard({ order, onMarkPaid }: { order: Order; onMarkPaid: (id: string) => void }) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <li className="border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif-display text-lg text-foreground">{order.name}</p>
        <p className="text-accent">{formatPrice(order.totalPriceCents)}</p>
      </div>
      <p className="text-xs text-muted">
        {order.email} · {order.phone}
      </p>
      <p className="mt-1 text-xs text-muted">
        {order.items.length} {order.items.length === 1 ? "desenho" : "desenhos"} · {totalQuantity}{" "}
        {totalQuantity === 1 ? "peça" : "peças"} ·{" "}
        {new Date(order.createdAt).toLocaleString("pt-BR")}
      </p>
      <ul className="mt-2 space-y-2">
        {order.items.map((item, i) => (
          <li key={i} className="border-t border-border pt-2 text-sm text-foreground/70">
            <p>
              {item.paperSize} · {item.theme} · Qtd: {item.quantity} ·{" "}
              {formatPrice(item.unitPriceCents === null ? null : item.unitPriceCents * item.quantity)}
            </p>
            <p className="whitespace-pre-wrap">{item.description}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs tracking-wide text-foreground/60 uppercase">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
        {(order.status === "pix_pending" || order.status === "pending_payment") && (
          <button
            type="button"
            onClick={() => onMarkPaid(order.id)}
            className="bg-accent px-4 py-2 text-xs tracking-wide text-white uppercase hover:bg-accent-dark"
          >
            Marcar como pago
          </button>
        )}
      </div>
    </li>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadOrders() {
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/orders").then(async (res) => {
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoginError(data.error ?? "Senha incorreta.");
      return;
    }
    setPassword("");
    loadOrders();
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthenticated(false);
    setOrders([]);
  }

  async function handleMarkPaid(id: string) {
    await fetch(`/api/admin/orders/${id}/mark-paid`, { method: "POST" });
    loadOrders();
  }

  if (authenticated === null) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24">
        <h1 className="font-serif-display text-3xl text-foreground">Área interna</h1>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
          />
          {loginError && <p className="text-sm text-accent">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-accent px-6 py-3 text-sm tracking-wide text-white uppercase hover:bg-accent-dark"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const pending = orders.filter(
    (o) => o.status === "pix_pending" || o.status === "pending_quote" || o.status === "pending_payment"
  );
  const others = orders.filter((o) => !pending.includes(o));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-serif-display text-3xl text-foreground">Pedidos</h1>
        <button type="button" onClick={handleLogout} className="text-xs text-foreground/60 underline">
          Sair
        </button>
      </div>

      <h2 className="mt-8 font-serif-display text-xl text-foreground">Pendentes</h2>
      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">Nenhum pedido pendente.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pending.map((order) => (
            <OrderCard key={order.id} order={order} onMarkPaid={handleMarkPaid} />
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <>
          <h2 className="mt-10 font-serif-display text-xl text-foreground">Histórico</h2>
          <ul className="mt-3 space-y-3">
            {others.map((order) => (
              <OrderCard key={order.id} order={order} onMarkPaid={handleMarkPaid} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
