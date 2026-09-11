"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ImageIcon,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Printer,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { formatPrice, PAPER_SIZES, THEME_LABELS } from "@/lib/pricing";

type OrderItem = {
  paperSize: string;
  theme: string;
  description: string;
  quantity: number;
  unitPriceCents: number | null;
  referenceFiles: string[];
};

type ShippingAddress = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type Order = {
  id: string;
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingCents: number;
  totalPriceCents: number | null;
  status: string;
  createdAt: string;
  paymentReference?: string;
  paidAt?: string;
  rushDays: number | null;
  rushCents: number;
  notes?: string;
};

type Tone = "waiting" | "attention" | "progress" | "done" | "cancelled";

const STATUS_META: Record<string, { order: string; payment: string; tone: Tone }> = {
  pending_quote: { order: "Aguardando orçamento", payment: "A combinar", tone: "attention" },
  pending_payment: { order: "Aguardando pagamento", payment: "Aguardando cartão", tone: "waiting" },
  pix_pending: { order: "Aguardando pagamento", payment: "Aguardando Pix", tone: "waiting" },
  paid: { order: "Em produção", payment: "Pago", tone: "progress" },
  shipped: { order: "Enviado", payment: "Pago", tone: "done" },
  cancelled: { order: "Cancelado", payment: "Cancelado", tone: "cancelled" },
};

const TONE_CLASSES: Record<Tone, string> = {
  waiting: "bg-amber-500/15 text-amber-800",
  attention: "bg-accent/15 text-accent",
  progress: "bg-emerald-600/15 text-emerald-800",
  done: "bg-accent-navy/15 text-accent-navy",
  cancelled: "bg-border text-muted/70",
};

const SUMMARY_BUCKETS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "pending_quote", label: "Pendentes", match: (s) => s === "pending_quote" },
  {
    key: "awaiting_payment",
    label: "Aguardando pagamento",
    match: (s) => s === "pending_payment" || s === "pix_pending",
  },
  { key: "paid", label: "Em produção", match: (s) => s === "paid" },
  { key: "shipped", label: "Enviados", match: (s) => s === "shipped" },
  { key: "cancelled", label: "Cancelados", match: (s) => s === "cancelled" },
];

function matchesStatusFilter(status: string, filter: string) {
  if (filter === "all") return true;
  const bucket = SUMMARY_BUCKETS.find((b) => b.key === filter);
  return bucket ? bucket.match(status) : status === filter;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getRushDeadline(order: Order): Date | null {
  if (order.rushDays === null) return null;
  const start = new Date(order.paidAt ?? order.createdAt);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + order.rushDays);
  return deadline;
}

function daysUntil(target: Date, now: number) {
  return Math.ceil((target.getTime() - now) / (24 * 60 * 60 * 1000));
}

function rushUrgency(deadline: Date | null, now: number): "overdue" | "soon" | "normal" | null {
  if (!deadline) return null;
  const d = daysUntil(deadline, now);
  if (d < 0) return "overdue";
  if (d <= 2) return "soon";
  return "normal";
}

const URGENCY_CLASSES: Record<"overdue" | "soon" | "normal", string> = {
  overdue: "border-accent bg-accent/10 text-accent",
  soon: "border-amber-500 bg-amber-500/10 text-amber-800",
  normal: "border-border bg-surface text-foreground/80",
};

function urgencyLabel(deadline: Date, now: number) {
  const d = daysUntil(deadline, now);
  if (d < 0) return `atrasado ${Math.abs(d)} ${Math.abs(d) === 1 ? "dia" : "dias"}`;
  if (d === 0) return "vence hoje";
  return `vence em ${d} ${d === 1 ? "dia" : "dias"}`;
}

function itemSummary(item: OrderItem) {
  const size = PAPER_SIZES[item.paperSize as keyof typeof PAPER_SIZES]?.label ?? item.paperSize;
  const theme = THEME_LABELS[item.theme] ?? item.theme;
  return `${size} · ${theme}`;
}

function orderSummary(order: Order) {
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  if (order.items.length === 1) {
    const item = order.items[0];
    return `${itemSummary(item)}${item.quantity > 1 ? ` · Qtd ${item.quantity}` : ""}`;
  }
  return `${order.items.length} desenhos · ${totalQty} peças`;
}

function paymentMethodLabel(order: Order) {
  if (order.status === "pix_pending" || order.status === "paid" || order.status === "shipped") return "Pix";
  return "A definir";
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportOrdersCsv(orders: Order[]) {
  const header = [
    "ID",
    "Data",
    "Status",
    "Nome",
    "E-mail",
    "Telefone",
    "Itens",
    "Total (R$)",
    "Cidade",
    "Estado",
    "Pago em",
  ];

  const rows = orders.map((o) => [
    o.id,
    formatDate(o.createdAt),
    STATUS_META[o.status]?.order ?? o.status,
    o.name,
    o.email,
    o.phone,
    orderSummary(o),
    o.totalPriceCents !== null ? (o.totalPriceCents / 100).toFixed(2).replace(".", ",") : "",
    o.shippingAddress?.city ?? "",
    o.shippingAddress?.state ?? "",
    o.paidAt ? formatDate(o.paidAt) : "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pedidos-canto-e-cor-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className={tone === "cancelled" ? "line-through decoration-muted/50" : ""}>{label}</span>
    </span>
  );
}

function Thumbnails({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: (src: string) => void;
}) {
  const files = order.items.flatMap((i) => i.referenceFiles);
  if (files.length === 0) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-background text-muted">
        <ImageIcon size={14} />
      </div>
    );
  }
  const visible = files.slice(0, 2);
  const extra = files.length - visible.length;
  return (
    <div className="flex shrink-0 -space-x-2">
      {visible.map((path, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(`/api/admin/files/${path}`);
          }}
          className="h-9 w-9 overflow-hidden border-2 border-background bg-surface"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/admin/files/${path}`} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
      {extra > 0 && (
        <div className="flex h-9 w-9 items-center justify-center border-2 border-background bg-muted/20 text-[11px] font-medium text-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}

function ActionsMenu({
  order,
  onMarkPaid,
  onMarkShipped,
  onCancel,
  onDelete,
  onOpenDetails,
}: {
  order: Order;
  onMarkPaid: (id: string) => void;
  onMarkShipped: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetails: () => void;
}) {
  const [open, setOpen] = useState(false);

  function act(fn: () => void) {
    fn();
    setOpen(false);
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mais ações"
        className="flex h-8 w-8 items-center justify-center text-foreground/60 hover:bg-border/50 hover:text-foreground"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute right-0 z-50 mt-1 w-56 border border-border bg-surface py-1 text-sm shadow-sm">
            <button
              type="button"
              onClick={() => act(onOpenDetails)}
              className="block w-full px-3 py-2 text-left text-foreground hover:bg-background"
            >
              Ver detalhes
            </button>
            {(order.status === "pix_pending" || order.status === "pending_payment") && (
              <button
                type="button"
                onClick={() => act(() => onMarkPaid(order.id))}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-background"
              >
                <Check size={14} /> Marcar como pago
              </button>
            )}
            {order.status === "paid" && (
              <button
                type="button"
                onClick={() => act(() => onMarkShipped(order.id))}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-background"
              >
                <Truck size={14} /> Marcar como enviado
              </button>
            )}
            <div className="my-1 border-t border-border" />
            {order.phone && (
              <button
                type="button"
                onClick={() => act(() => copyText(order.phone))}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-background"
              >
                <Phone size={14} /> Copiar telefone
              </button>
            )}
            <button
              type="button"
              onClick={() => act(() => copyText(order.email))}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-background"
            >
              <Mail size={14} /> Copiar e-mail
            </button>
            {order.shippingAddress?.cep && (
              <button
                type="button"
                onClick={() =>
                  act(() =>
                    copyText(
                      `${order.shippingAddress.street}, ${order.shippingAddress.number}${
                        order.shippingAddress.complement ? ` - ${order.shippingAddress.complement}` : ""
                      } · ${order.shippingAddress.neighborhood} · ${order.shippingAddress.city} - ${order.shippingAddress.state} · CEP ${order.shippingAddress.cep}`
                    )
                  )
                }
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-background"
              >
                <MapPin size={14} /> Copiar endereço
              </button>
            )}
            {order.status !== "cancelled" && order.status !== "shipped" && (
              <button
                type="button"
                onClick={() => act(() => onCancel(order.id))}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted hover:bg-background"
              >
                <Ban size={14} /> Cancelar pedido
              </button>
            )}
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={() => act(() => onDelete(order.id))}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-accent hover:bg-accent/5"
            >
              <Trash2 size={14} /> Excluir pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function QuoteForm({ orderId }: { orderId: string }) {
  const [amount, setAmount] = useState("");
  const [links, setLinks] = useState<{ pixUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setError(null);
    const amountReais = Number(amount.replace(",", "."));
    if (!amountReais || amountReais <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountReais }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Não foi possível gerar a cobrança.");
      return;
    }
    setLinks(await res.json());
  }

  return (
    <div className="border border-dashed border-accent/40 bg-accent/5 p-3">
      <p className="text-xs font-medium text-accent uppercase tracking-wide">Valor a combinar</p>
      {links ? (
        <div className="mt-2 space-y-1 text-xs">
          <p className="text-foreground/70">E-mail com os links já foi enviado ao cliente.</p>
          <p className="break-all">
            Pix:{" "}
            <a className="text-accent underline" href={links.pixUrl} target="_blank" rel="noreferrer">
              {links.pixUrl}
            </a>
          </p>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Valor combinado (R$)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-36 border border-border bg-background p-2 text-xs outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="bg-accent px-3 py-2 text-xs tracking-wide text-white uppercase hover:bg-accent-dark disabled:opacity-60"
          >
            {loading ? "Gerando..." : "Definir valor"}
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}

function NotesEditor({ orderId, initialNotes }: { orderId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar a nota.");
      return;
    }
    setSavedAt(Date.now());
  }

  return (
    <section className="mt-6">
      <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Notas internas</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder="Ex: combinou mudança de cor por WhatsApp em 12/09..."
        className="mt-2 w-full border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="border border-border px-3 py-1.5 text-xs tracking-wide text-foreground/70 uppercase hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar nota"}
        </button>
        {savedAt && <span className="text-xs text-muted">Salvo.</span>}
        {error && <span className="text-xs text-accent">{error}</span>}
      </div>
    </section>
  );
}

function PaidAtEditor({ orderId, paidAt }: { orderId: string; paidAt?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => (paidAt ? paidAt.slice(0, 16) : ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!value) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/paid-at`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAt: new Date(value).toISOString() }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível corrigir a data.");
      return;
    }
    setEditing(false);
    window.location.reload();
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted underline">
        {paidAt ? "Corrigir data de pagamento" : "Definir data de pagamento"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-border bg-background p-2 text-xs outline-none focus:border-accent"
      />
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="bg-accent px-3 py-1.5 text-xs tracking-wide text-white uppercase hover:bg-accent-dark disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted underline">
        Cancelar
      </button>
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}

function OrderDetailPanel({
  order,
  now,
  onClose,
  onOpenImage,
  onMarkPaid,
  onMarkShipped,
  onCancel,
  onDelete,
}: {
  order: Order;
  now: number;
  onClose: () => void;
  onOpenImage: (src: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkShipped: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = STATUS_META[order.status] ?? { order: order.status, payment: order.status, tone: "waiting" as Tone };
  const hasAddress = !!order.shippingAddress?.cep;
  const [showLabel, setShowLabel] = useState(false);
  const rushDeadline = getRushDeadline(order);
  const urgency = rushUrgency(rushDeadline, now);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30"
      />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-background p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif-display text-2xl text-foreground">{order.name}</p>
            <p className="mt-1 text-xs text-muted">
              Pedido criado em {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground/60 hover:bg-border/50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge label={meta.order} tone={meta.tone} />
          <StatusBadge label={meta.payment} tone={meta.tone === "attention" ? "attention" : meta.tone} />
        </div>

        {order.rushDays !== null && (
          <div
            className={`mt-4 flex items-center gap-3 border p-3 ${
              URGENCY_CLASSES[urgency ?? "normal"]
            }`}
          >
            <Clock size={18} className="shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Prazo expresso: em até {order.rushDays} dias</p>
              {rushDeadline && (
                <p className="text-xs opacity-80">
                  Vence em {formatDate(rushDeadline.toISOString())} · {urgencyLabel(rushDeadline, now)}
                </p>
              )}
            </div>
          </div>
        )}

        <section className="mt-8">
          <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Cliente</h3>
          <div className="mt-2 space-y-1 text-sm text-foreground">
            <p>{order.name}</p>
            <p className="flex items-center gap-2 text-foreground/70">
              <Mail size={14} className="text-muted" /> {order.email}
              <button
                type="button"
                onClick={() => copyText(order.email)}
                aria-label="Copiar e-mail"
                className="text-muted hover:text-accent"
              >
                <Copy size={12} />
              </button>
            </p>
            <p className="flex items-center gap-2 text-foreground/70">
              <Phone size={14} className="text-muted" /> {order.phone}
              <button
                type="button"
                onClick={() => copyText(order.phone)}
                aria-label="Copiar telefone"
                className="text-muted hover:text-accent"
              >
                <Copy size={12} />
              </button>
            </p>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Pedido</h3>
          <ul className="mt-2 space-y-3">
            {order.items.map((item, i) => (
              <li key={i} className="border border-border bg-surface p-3 text-sm">
                <p className="text-foreground">
                  {itemSummary(item)} · Qtd {item.quantity} ·{" "}
                  {formatPrice(item.unitPriceCents === null ? null : item.unitPriceCents * item.quantity)}
                </p>
                {item.description && (
                  <p className="mt-1 whitespace-pre-wrap text-foreground/70">{item.description}</p>
                )}
                {item.referenceFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.referenceFiles.map((path, fi) => (
                      <button
                        key={fi}
                        type="button"
                        onClick={() => onOpenImage(`/api/admin/files/${path}`)}
                        className="h-16 w-16 overflow-hidden border border-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/admin/files/${path}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {order.status === "pending_quote" && (
            <div className="mt-3">
              <QuoteForm orderId={order.id} />
            </div>
          )}
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Entrega</h3>
          {hasAddress ? (
            <div className="mt-2 space-y-1 text-sm text-foreground/80">
              <p>
                {order.shippingAddress.street}, {order.shippingAddress.number}
                {order.shippingAddress.complement ? ` - ${order.shippingAddress.complement}` : ""}
              </p>
              <p>
                {order.shippingAddress.neighborhood} · {order.shippingAddress.city} -{" "}
                {order.shippingAddress.state}
              </p>
              <p>CEP {order.shippingAddress.cep}</p>
              <p className="text-muted">
                Frete: {order.shippingCents === 0 ? "Grátis" : formatPrice(order.shippingCents)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Sem endereço cadastrado.</p>
          )}
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Pagamento</h3>
          <div className="mt-2 space-y-1 text-sm text-foreground/80">
            <p className="text-lg font-medium text-accent">{formatPrice(order.totalPriceCents)}</p>
            <p>Método: {paymentMethodLabel(order)}</p>
            {order.paidAt && <p className="text-muted">Pago em {formatDate(order.paidAt)}</p>}
            <PaidAtEditor orderId={order.id} paidAt={order.paidAt} />
          </div>
        </section>

        <NotesEditor orderId={order.id} initialNotes={order.notes ?? ""} />

        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
          {hasAddress && (
            <button
              type="button"
              onClick={() => setShowLabel(true)}
              className="flex items-center gap-2 border border-border px-4 py-2 text-xs tracking-wide text-foreground/70 uppercase hover:border-accent hover:text-accent"
            >
              <Printer size={14} /> Imprimir etiqueta
            </button>
          )}
          {(order.status === "pix_pending" || order.status === "pending_payment") && (
            <button
              type="button"
              onClick={() => onMarkPaid(order.id)}
              className="flex items-center gap-2 bg-accent px-4 py-2 text-xs tracking-wide text-white uppercase hover:bg-accent-dark"
            >
              <Check size={14} /> Marcar como pago
            </button>
          )}
          {order.status === "paid" && (
            <button
              type="button"
              onClick={() => onMarkShipped(order.id)}
              className="flex items-center gap-2 bg-accent px-4 py-2 text-xs tracking-wide text-white uppercase hover:bg-accent-dark"
            >
              <Truck size={14} /> Marcar como enviado
            </button>
          )}
          {order.status !== "cancelled" && order.status !== "shipped" && (
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              className="flex items-center gap-2 border border-border px-4 py-2 text-xs tracking-wide text-muted uppercase hover:border-accent hover:text-accent"
            >
              <Ban size={14} /> Cancelar pedido
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(order.id)}
            className="flex items-center gap-2 border border-accent/40 px-4 py-2 text-xs tracking-wide text-accent uppercase hover:bg-accent hover:text-white"
          >
            <Trash2 size={14} /> Excluir pedido
          </button>
        </div>
      </div>
      {showLabel && <PrintLabelModal order={order} onClose={() => setShowLabel(false)} />}
    </div>
  );
}

type RowProps = {
  order: Order;
  now: number;
  onOpenDetails: () => void;
  onOpenImage: (src: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkShipped: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

function RushIndicator({ order, now }: { order: Order; now: number }) {
  if (order.rushDays === null) return null;
  const deadline = getRushDeadline(order);
  const urgency = rushUrgency(deadline, now);
  const textClass =
    urgency === "overdue" ? "text-accent" : urgency === "soon" ? "text-amber-800" : "text-muted";
  return (
    <p className={`mt-0.5 flex items-center gap-1 truncate text-xs ${textClass}`}>
      <Clock size={11} className="shrink-0" />
      {order.rushDays}d{deadline ? ` · ${urgencyLabel(deadline, now)}` : ""}
    </p>
  );
}

function DesktopOrderRow({
  order,
  now,
  onOpenDetails,
  onOpenImage,
  onMarkPaid,
  onMarkShipped,
  onCancel,
  onDelete,
  selected,
  onToggleSelect,
}: RowProps) {
  const meta = STATUS_META[order.status] ?? { order: order.status, payment: order.status, tone: "waiting" as Tone };

  return (
    <tr onClick={onOpenDetails} className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface/60">
      <td className="px-3 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(order.id)}
          aria-label={`Selecionar pedido de ${order.name}`}
          className="h-4 w-4 accent-accent"
        />
      </td>
      <td className="min-w-0 px-4 py-3 align-middle">
        <p className="truncate font-serif-display text-base text-foreground">{order.name}</p>
        <p className="truncate text-xs text-muted">{order.phone || order.email}</p>
      </td>
      <td className="min-w-0 px-4 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <Thumbnails order={order} onOpen={onOpenImage} />
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground/80">{orderSummary(order)}</p>
            <RushIndicator order={order} now={now} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-xs whitespace-nowrap text-muted">
        {formatDate(order.createdAt)}
      </td>
      <td className="px-4 py-3 text-right align-middle text-sm font-medium whitespace-nowrap text-foreground">
        {order.totalPriceCents === null ? (
          <span className="text-accent">A combinar</span>
        ) : (
          formatPrice(order.totalPriceCents)
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <StatusBadge label={meta.payment} tone={meta.tone} />
      </td>
      <td className="px-4 py-3 align-middle">
        <StatusBadge label={meta.order} tone={meta.tone} />
      </td>
      <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onOpenDetails}
            className="px-2 py-1.5 text-xs tracking-wide text-accent hover:underline"
          >
            Ver detalhes
          </button>
          <ActionsMenu
            order={order}
            onMarkPaid={onMarkPaid}
            onMarkShipped={onMarkShipped}
            onCancel={onCancel}
            onDelete={onDelete}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </td>
    </tr>
  );
}

function MobileOrderCard({
  order,
  now,
  onOpenDetails,
  onOpenImage,
  onMarkPaid,
  onMarkShipped,
  onCancel,
  onDelete,
  selected,
  onToggleSelect,
}: RowProps) {
  const meta = STATUS_META[order.status] ?? { order: order.status, payment: order.status, tone: "waiting" as Tone };

  return (
    <li
      onClick={onOpenDetails}
      className="flex cursor-pointer flex-col gap-2 border-b border-border p-4 last:border-b-0 hover:bg-surface/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(order.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Selecionar pedido de ${order.name}`}
            className="mt-1 h-4 w-4 shrink-0 accent-accent"
          />
          <div className="min-w-0">
            <p className="truncate font-serif-display text-base text-foreground">{order.name}</p>
            <p className="truncate text-xs text-muted">{order.phone || order.email}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsMenu
            order={order}
            onMarkPaid={onMarkPaid}
            onMarkShipped={onMarkShipped}
            onCancel={onCancel}
            onDelete={onDelete}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Thumbnails order={order} onOpen={onOpenImage} />
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground/80">{orderSummary(order)}</p>
          <RushIndicator order={order} now={now} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={meta.payment} tone={meta.tone} />
        <StatusBadge label={meta.order} tone={meta.tone} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{formatDate(order.createdAt)}</span>
        <span className="text-sm font-medium text-foreground">
          {order.totalPriceCents === null ? (
            <span className="text-accent">A combinar</span>
          ) : (
            formatPrice(order.totalPriceCents)
          )}
        </span>
      </div>
    </li>
  );
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/70 p-6">
      <button
        type="button"
        aria-label="Fechar imagem"
        onClick={onClose}
        className="absolute inset-0"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center bg-background text-foreground"
      >
        <X size={18} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="relative max-h-full max-w-full border-4 border-background object-contain"
      />
    </div>
  );
}

function PrintLabelModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const addr = order.shippingAddress;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 p-6 print:static print:bg-white print:p-0">
      <div className="absolute inset-0 print:hidden" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background p-6 print:max-w-none print:p-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <p className="font-serif-display text-lg text-foreground">Etiqueta de envio</p>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-foreground/60 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div id="shipping-label" className="border-2 border-foreground p-6 text-sm text-foreground">
          <p className="text-xs tracking-wide text-muted uppercase">Canto e Cor Ateliê</p>
          <p className="mt-1 text-xs text-muted">Pedido #{order.id.slice(0, 8)} · {formatDate(order.createdAt)}</p>
          <div className="mt-4 border-t border-foreground/20 pt-4">
            <p className="text-xs tracking-wide text-muted uppercase">Destinatário</p>
            <p className="mt-1 font-serif-display text-lg">{order.name}</p>
            <p className="mt-1">
              {addr.street}, {addr.number}
              {addr.complement ? ` - ${addr.complement}` : ""}
            </p>
            <p>{addr.neighborhood}</p>
            <p>
              {addr.city} - {addr.state}
            </p>
            <p>CEP {addr.cep}</p>
            <p className="mt-1 text-foreground/70">{order.phone}</p>
          </div>
          <div className="mt-4 border-t border-foreground/20 pt-4 text-foreground/80">
            <p className="text-xs tracking-wide text-muted uppercase">Conteúdo</p>
            <p className="mt-1">{orderSummary(order)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 flex w-full items-center justify-center gap-2 bg-accent px-4 py-2.5 text-xs tracking-wide text-white uppercase hover:bg-accent-dark print:hidden"
        >
          <Printer size={14} /> Imprimir
        </button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #shipping-label, #shipping-label * { visibility: visible; }
          #shipping-label {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

function MonthlyReport({ orders }: { orders: Order[] }) {
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const monthOrders = useMemo(
    () => orders.filter((o) => monthKey(new Date(o.paidAt ?? o.createdAt)) === month),
    [orders, month]
  );

  const paidOrders = monthOrders.filter((o) => o.status === "paid" || o.status === "shipped");
  const cancelledOrders = monthOrders.filter((o) => o.status === "cancelled");
  const openOrders = monthOrders.filter(
    (o) => o.status === "pending_quote" || o.status === "pending_payment" || o.status === "pix_pending"
  );

  const revenueCents = paidOrders.reduce((sum, o) => sum + (o.totalPriceCents ?? 0), 0);
  const piecesSold = paidOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const avgTicketCents = paidOrders.length > 0 ? Math.round(revenueCents / paidOrders.length) : 0;

  const byTheme = new Map<string, { count: number; revenueCents: number }>();
  const bySize = new Map<string, { count: number; revenueCents: number }>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      const themeEntry = byTheme.get(item.theme) ?? { count: 0, revenueCents: 0 };
      themeEntry.count += item.quantity;
      themeEntry.revenueCents += (item.unitPriceCents ?? 0) * item.quantity;
      byTheme.set(item.theme, themeEntry);

      const sizeEntry = bySize.get(item.paperSize) ?? { count: 0, revenueCents: 0 };
      sizeEntry.count += item.quantity;
      sizeEntry.revenueCents += (item.unitPriceCents ?? 0) * item.quantity;
      bySize.set(item.paperSize, sizeEntry);
    }
  }

  const themeRows = Array.from(byTheme.entries()).sort((a, b) => b[1].count - a[1].count);
  const sizeRows = Array.from(bySize.entries()).sort((a, b) => b[1].count - a[1].count);
  const maxThemeCount = Math.max(1, ...themeRows.map(([, v]) => v.count));
  const maxSizeCount = Math.max(1, ...sizeRows.map(([, v]) => v.count));

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Mês anterior"
          className="flex h-8 w-8 items-center justify-center border border-border hover:border-accent"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="w-48 text-center font-serif-display text-xl text-foreground">
          {monthLabel(month)}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          aria-label="Próximo mês"
          className="flex h-8 w-8 items-center justify-center border border-border hover:border-accent"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-2xl text-accent">{formatPrice(revenueCents)}</p>
          <p className="mt-1 text-xs text-muted">Faturamento do mês</p>
        </div>
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-2xl text-foreground">{paidOrders.length}</p>
          <p className="mt-1 text-xs text-muted">Pedidos pagos</p>
        </div>
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-2xl text-foreground">{piecesSold}</p>
          <p className="mt-1 text-xs text-muted">Peças vendidas</p>
        </div>
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-2xl text-foreground">{formatPrice(avgTicketCents)}</p>
          <p className="mt-1 text-xs text-muted">Ticket médio</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-serif-display text-lg text-foreground">Temas mais pedidos</h3>
          {themeRows.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum pedido pago neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {themeRows.map(([theme, v]) => (
                <li key={theme}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground">{THEME_LABELS[theme] ?? theme}</span>
                    <span className="text-muted">
                      {v.count} · {formatPrice(v.revenueCents)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-border">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(v.count / maxThemeCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="font-serif-display text-lg text-foreground">Tamanhos mais pedidos</h3>
          {sizeRows.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum pedido pago neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sizeRows.map(([size, v]) => (
                <li key={size}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground">
                      {PAPER_SIZES[size as keyof typeof PAPER_SIZES]?.label ?? size}
                    </span>
                    <span className="text-muted">
                      {v.count} · {formatPrice(v.revenueCents)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-border">
                    <div
                      className="h-full bg-accent-navy"
                      style={{ width: `${(v.count / maxSizeCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-xl text-foreground">{openOrders.length}</p>
          <p className="mt-1 text-xs text-muted">Em aberto</p>
        </div>
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-xl text-foreground">{cancelledOrders.length}</p>
          <p className="mt-1 text-xs text-muted">Cancelados</p>
        </div>
        <div className="border border-border bg-surface p-4">
          <p className="font-serif-display text-xl text-foreground">{monthOrders.length}</p>
          <p className="mt-1 text-xs text-muted">Total no mês</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"orders" | "report">("orders");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const searchRef = useRef<HTMLInputElement>(null);

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

  // Atualiza a lista sozinha de tempos em tempos, para não ficar olhando
  // dados desatualizados se o painel ficar aberto em mais de um lugar.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadOrders();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
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
    setActionError(null);
    const res = await fetch(`/api/admin/orders/${id}/mark-paid`, { method: "POST" });
    if (!res.ok) {
      setActionError("Não foi possível marcar como pago. Tente novamente.");
      return;
    }
    loadOrders();
  }

  async function handleMarkShipped(id: string) {
    setActionError(null);
    const res = await fetch(`/api/admin/orders/${id}/mark-shipped`, { method: "POST" });
    if (!res.ok) {
      setActionError("Não foi possível marcar como enviado. Tente novamente.");
      return;
    }
    loadOrders();
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar este pedido?")) return;
    setActionError(null);
    const res = await fetch(`/api/admin/orders/${id}/cancel`, { method: "POST" });
    if (!res.ok) {
      setActionError("Não foi possível cancelar o pedido. Tente novamente.");
      return;
    }
    setSelectedId((current) => (current === id ? null : current));
    loadOrders();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este pedido definitivamente? Essa ação não pode ser desfeita.")) return;
    setActionError(null);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setActionError("Não foi possível excluir o pedido. Tente novamente.");
      return;
    }
    setSelectedId((current) => (current === id ? null : current));
    loadOrders();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBulkMarkPaid() {
    const ids = Array.from(selectedIds).filter((id) => {
      const order = orders.find((o) => o.id === id);
      return order && (order.status === "pix_pending" || order.status === "pending_payment");
    });
    if (ids.length === 0) return;
    if (!window.confirm(`Marcar ${ids.length} pedido(s) como pago?`)) return;
    setActionError(null);
    setBulkWorking(true);
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/admin/orders/${id}/mark-paid`, { method: "POST" }))
    );
    setBulkWorking(false);
    if (results.some((r) => !r.ok)) {
      setActionError("Alguns pedidos não puderam ser marcados como pago. Confira a lista e tente de novo.");
    }
    clearSelection();
    loadOrders();
  }

  async function handleBulkCancel() {
    const ids = Array.from(selectedIds).filter((id) => {
      const order = orders.find((o) => o.id === id);
      return order && order.status !== "cancelled" && order.status !== "shipped";
    });
    if (ids.length === 0) return;
    if (!window.confirm(`Cancelar ${ids.length} pedido(s)?`)) return;
    setActionError(null);
    setBulkWorking(true);
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/admin/orders/${id}/cancel`, { method: "POST" }))
    );
    setBulkWorking(false);
    if (results.some((r) => !r.ok)) {
      setActionError("Alguns pedidos não puderam ser cancelados. Confira a lista e tente de novo.");
    }
    clearSelection();
    loadOrders();
  }

  const productOptions = useMemo(() => {
    const values = new Set<string>();
    orders.forEach((o) => o.items.forEach((i) => values.add(i.theme)));
    return Array.from(values);
  }, [orders]);

  const urgentOrders = useMemo(() => {
    return orders
      .filter(
        (o) =>
          o.rushDays !== null &&
          (o.status === "paid" || o.status === "pix_pending" || o.status === "pending_payment")
      )
      .map((o) => ({ order: o, deadline: getRushDeadline(o)! }))
      .filter(({ deadline }) => daysUntil(deadline, now) <= 2)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [orders, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dateLimits: Record<string, number> = { "7d": 7, "30d": 30 };

    let list = orders.filter((o) => {
      if (!matchesStatusFilter(o.status, statusFilter)) return false;
      if (productFilter !== "all" && !o.items.some((i) => i.theme === productFilter)) return false;
      if (dateFilter !== "all" && dateFilter !== "today") {
        const days = dateLimits[dateFilter];
        if (days && now - new Date(o.createdAt).getTime() > days * 24 * 60 * 60 * 1000) return false;
      }
      if (dateFilter === "today") {
        const d = new Date(o.createdAt);
        const today = new Date(now);
        if (
          d.getFullYear() !== today.getFullYear() ||
          d.getMonth() !== today.getMonth() ||
          d.getDate() !== today.getDate()
        ) {
          return false;
        }
      }
      if (q) {
        const haystack = `${o.name} ${o.email} ${o.phone} ${o.id}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === "deadline") {
        const ad = getRushDeadline(a);
        const bd = getRushDeadline(b);
        if (!ad && !bd) return 0;
        if (!ad) return 1;
        if (!bd) return -1;
        return ad.getTime() - bd.getTime();
      }
      const av = a.totalPriceCents;
      const bv = b.totalPriceCents;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortBy === "highest" ? bv - av : av - bv;
    });

    return list;
  }, [orders, search, statusFilter, productFilter, dateFilter, sortBy, now]);

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null;

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

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-3xl text-foreground">Pedidos</h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie pedidos, pagamentos, produção e entregas.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView(view === "orders" ? "report" : "orders")}
            className="flex items-center gap-1.5 border border-accent px-3 py-1.5 text-xs tracking-wide text-accent uppercase hover:bg-accent hover:text-white"
          >
            <BarChart3 size={14} /> {view === "orders" ? "Relatório mensal" : "Ver pedidos"}
          </button>
          <button type="button" onClick={handleLogout} className="text-xs text-foreground/60 underline">
            Sair
          </button>
        </div>
      </div>

      {urgentOrders.length > 0 && (
        <div className="mt-6 border border-accent/40 bg-accent/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-accent">
            <AlertTriangle size={16} /> Prazos expressos vencendo
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground/80">
            {urgentOrders.map(({ order, deadline }) => {
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(order.id)}
                    className="underline decoration-dotted hover:text-accent"
                  >
                    {order.name}
                  </button>{" "}
                  — {urgencyLabel(deadline, now)} ({formatDate(deadline.toISOString())})
                  {order.status !== "paid" && (
                    <span className="ml-1.5 text-xs text-accent/80">· ainda não pago</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {actionError && (
        <div className="mt-6 flex items-center justify-between gap-3 border border-accent/40 bg-accent/5 p-3 text-sm text-accent">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs underline">
            Fechar
          </button>
        </div>
      )}

      {view === "report" ? (
        <MonthlyReport orders={orders} />
      ) : (
        <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SUMMARY_BUCKETS.map((bucket) => {
          const count = orders.filter((o) => bucket.match(o.status)).length;
          const active = statusFilter === bucket.key;
          return (
            <button
              key={bucket.key}
              type="button"
              onClick={() => setStatusFilter(active ? "all" : bucket.key)}
              className={`border p-4 text-left transition-colors ${
                active ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/40"
              }`}
            >
              <p className="font-serif-display text-2xl text-foreground">{count}</p>
              <p className="mt-1 text-xs text-muted">{bucket.label}</p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            const inProduction = orders.filter((o) => o.status === "paid");
            const pieces = inProduction.reduce(
              (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
              0
            );
            window.alert(
              `${inProduction.length} pedido(s) em produção · ${pieces} peça(s) no total para pintar.`
            );
          }}
          className="border border-border bg-surface p-4 text-left transition-colors hover:border-accent/40"
        >
          <p className="font-serif-display text-2xl text-foreground">
            {orders
              .filter((o) => o.status === "paid")
              .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
          </p>
          <p className="mt-1 text-xs text-muted">Peças em produção</p>
        </button>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => exportOrdersCsv(orders)}
          className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs tracking-wide text-foreground/70 uppercase hover:border-accent hover:text-accent"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, telefone, e-mail ou pedido..."
            className="w-full border border-border bg-surface py-2.5 pr-3 pl-9 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="all">Todos os status</option>
            {SUMMARY_BUCKETS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="all">Todos os produtos</option>
            {productOptions.map((theme) => (
              <option key={theme} value={theme}>
                {THEME_LABELS[theme] ?? theme}
              </option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="all">Qualquer data</option>
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="deadline">Prazo mais próximo</option>
            <option value="highest">Maior valor</option>
            <option value="lowest">Menor valor</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-accent/40 bg-accent/5 p-3 text-sm">
          <span className="text-foreground/80">{selectedIds.size} selecionado(s)</span>
          <button
            type="button"
            disabled={bulkWorking}
            onClick={handleBulkMarkPaid}
            className="border border-accent px-3 py-1.5 text-xs tracking-wide text-accent uppercase hover:bg-accent hover:text-white disabled:opacity-50"
          >
            Marcar como pago
          </button>
          <button
            type="button"
            disabled={bulkWorking}
            onClick={handleBulkCancel}
            className="border border-border px-3 py-1.5 text-xs tracking-wide text-muted uppercase hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-muted underline"
          >
            Limpar seleção
          </button>
        </div>
      )}

      <div className="mt-4 border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nenhum pedido encontrado.</p>
        ) : (
          <>
            <table className="hidden w-full table-fixed border-collapse lg:table">
              <colgroup>
                <col className="w-[36px]" />
                <col className="w-[23%]" />
                <col className="w-[24%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[150px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-background/60 text-[11px] font-medium tracking-wide text-muted uppercase">
                  <th className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(filtered.map((o) => o.id)));
                        } else {
                          clearSelection();
                        }
                      }}
                      aria-label="Selecionar todos os pedidos visíveis"
                      className="h-4 w-4 accent-accent"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2.5 text-left font-medium">Pedido</th>
                  <th className="px-4 py-2.5 text-left font-medium">Data</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-4 py-2.5 text-left font-medium">Pagamento</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <DesktopOrderRow
                    key={order.id}
                    order={order}
                    now={now}
                    onOpenDetails={() => setSelectedId(order.id)}
                    onOpenImage={setLightboxSrc}
                    onMarkPaid={handleMarkPaid}
                    onMarkShipped={handleMarkShipped}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    selected={selectedIds.has(order.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </tbody>
            </table>

            <ul className="lg:hidden">
              {filtered.map((order) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  onOpenDetails={() => setSelectedId(order.id)}
                  onOpenImage={setLightboxSrc}
                  onMarkPaid={handleMarkPaid}
                  onMarkShipped={handleMarkShipped}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  selected={selectedIds.has(order.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </ul>
          </>
        )}
      </div>
        </>
      )}

      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          now={now}
          onClose={() => setSelectedId(null)}
          onOpenImage={setLightboxSrc}
          onMarkPaid={handleMarkPaid}
          onMarkShipped={handleMarkShipped}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      )}

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
