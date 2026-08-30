"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Check,
  Copy,
  ImageIcon,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
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
  waiting: "bg-muted/10 text-muted",
  attention: "bg-accent/10 text-accent",
  progress: "bg-accent-dark/10 text-accent-dark",
  done: "bg-accent-navy/10 text-accent-navy",
  cancelled: "bg-border/60 text-muted",
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
  if (order.paymentReference) return "Cartão";
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

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
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
  onOpenDetails,
}: {
  order: Order;
  onMarkPaid: (id: string) => void;
  onMarkShipped: (id: string) => void;
  onCancel: (id: string) => void;
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
              <>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => act(() => onCancel(order.id))}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted hover:bg-background"
                >
                  <Ban size={14} /> Cancelar pedido
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function QuoteForm({ orderId }: { orderId: string }) {
  const [amount, setAmount] = useState("");
  const [links, setLinks] = useState<{ pixUrl: string; checkoutUrl: string | null } | null>(null);
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
          {links.checkoutUrl && (
            <p className="break-all">
              Cartão:{" "}
              <a className="text-accent underline" href={links.checkoutUrl} target="_blank" rel="noreferrer">
                {links.checkoutUrl}
              </a>
            </p>
          )}
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

function OrderDetailPanel({
  order,
  onClose,
  onOpenImage,
  onMarkPaid,
  onMarkShipped,
  onCancel,
}: {
  order: Order;
  onClose: () => void;
  onOpenImage: (src: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkShipped: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const meta = STATUS_META[order.status] ?? { order: order.status, payment: order.status, tone: "waiting" as Tone };
  const hasAddress = !!order.shippingAddress?.cep;

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
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
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
        </div>
      </div>
    </div>
  );
}

type RowProps = {
  order: Order;
  onOpenDetails: () => void;
  onOpenImage: (src: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkShipped: (id: string) => void;
  onCancel: (id: string) => void;
};

function DesktopOrderRow({ order, onOpenDetails, onOpenImage, onMarkPaid, onMarkShipped, onCancel }: RowProps) {
  const meta = STATUS_META[order.status] ?? { order: order.status, payment: order.status, tone: "waiting" as Tone };

  return (
    <tr onClick={onOpenDetails} className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface/60">
      <td className="min-w-0 px-4 py-3 align-middle">
        <p className="truncate font-serif-display text-base text-foreground">{order.name}</p>
        <p className="truncate text-xs text-muted">{order.phone || order.email}</p>
      </td>
      <td className="min-w-0 px-4 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <Thumbnails order={order} onOpen={onOpenImage} />
          <p className="truncate text-sm text-foreground/80">{orderSummary(order)}</p>
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
            onOpenDetails={onOpenDetails}
          />
        </div>
      </td>
    </tr>
  );
}

function MobileOrderCard({ order, onOpenDetails, onOpenImage, onMarkPaid, onMarkShipped, onCancel }: RowProps) {
  const meta = STATUS_META[order.status] ?? { order: order.status, payment: order.status, tone: "waiting" as Tone };

  return (
    <li
      onClick={onOpenDetails}
      className="flex cursor-pointer flex-col gap-2 border-b border-border p-4 last:border-b-0 hover:bg-surface/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-serif-display text-base text-foreground">{order.name}</p>
          <p className="truncate text-xs text-muted">{order.phone || order.email}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsMenu
            order={order}
            onMarkPaid={onMarkPaid}
            onMarkShipped={onMarkShipped}
            onCancel={onCancel}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Thumbnails order={order} onOpen={onOpenImage} />
        <p className="truncate text-sm text-foreground/80">{orderSummary(order)}</p>
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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

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

  async function handleMarkShipped(id: string) {
    await fetch(`/api/admin/orders/${id}/mark-shipped`, { method: "POST" });
    loadOrders();
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar este pedido?")) return;
    await fetch(`/api/admin/orders/${id}/cancel`, { method: "POST" });
    setSelectedId((current) => (current === id ? null : current));
    loadOrders();
  }

  const productOptions = useMemo(() => {
    const values = new Set<string>();
    orders.forEach((o) => o.items.forEach((i) => values.add(i.theme)));
    return Array.from(values);
  }, [orders]);

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
        <button type="button" onClick={handleLogout} className="text-xs text-foreground/60 underline">
          Sair
        </button>
      </div>

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
            <option value="highest">Maior valor</option>
            <option value="lowest">Menor valor</option>
          </select>
        </div>
      </div>

      <div className="mt-4 border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nenhum pedido encontrado.</p>
        ) : (
          <>
            <table className="hidden w-full table-fixed border-collapse lg:table">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[25%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
                <col className="w-[150px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-background/60 text-[11px] font-medium tracking-wide text-muted uppercase">
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
                    onOpenDetails={() => setSelectedId(order.id)}
                    onOpenImage={setLightboxSrc}
                    onMarkPaid={handleMarkPaid}
                    onMarkShipped={handleMarkShipped}
                    onCancel={handleCancel}
                  />
                ))}
              </tbody>
            </table>

            <ul className="lg:hidden">
              {filtered.map((order) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  onOpenDetails={() => setSelectedId(order.id)}
                  onOpenImage={setLightboxSrc}
                  onMarkPaid={handleMarkPaid}
                  onMarkShipped={handleMarkShipped}
                  onCancel={handleCancel}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedId(null)}
          onOpenImage={setLightboxSrc}
          onMarkPaid={handleMarkPaid}
          onMarkShipped={handleMarkShipped}
          onCancel={handleCancel}
        />
      )}

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
