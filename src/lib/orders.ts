import { randomUUID } from "crypto";
import { put, get, list, del } from "@vercel/blob";
import type { PaperSize } from "./pricing";

export type OrderTheme = "casal" | "pet" | "retrato" | "santo" | "homenagem" | "outro";

export interface OrderItem {
  paperSize: PaperSize;
  theme: OrderTheme;
  description: string;
  referenceFiles: string[];
  quantity: number;
  unitPriceCents: number | null;
}

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const EMPTY_ADDRESS: ShippingAddress = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: "pending_payment" | "pending_quote" | "pix_pending" | "paid" | "shipped" | "cancelled";
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingCents: number;
  totalPriceCents: number | null;
  paymentReference?: string;
  paidAt?: string;
  rushDays: number | null;
  rushCents: number;
  notes?: string;
  reminderSentAt?: string;
  deletedAt?: string;
}

// Pedidos criados antes da mudança para múltiplos desenhos guardavam os
// campos soltos (paperSize/theme/description/priceCents) em vez de `items`.
// Isso adapta esses registros antigos para o formato novo.
function normalizeOrder(raw: Record<string, unknown>): OrderRecord {
  const shippingAddress = (raw.shippingAddress as ShippingAddress) ?? EMPTY_ADDRESS;
  const shippingCents = typeof raw.shippingCents === "number" ? raw.shippingCents : 0;
  const rushDays = typeof raw.rushDays === "number" ? raw.rushDays : null;
  const rushCents = typeof raw.rushCents === "number" ? raw.rushCents : 0;

  if (Array.isArray(raw.items)) {
    const paymentReference = (raw.paymentReference ?? raw.stripeSessionId) as string | undefined;
    return {
      ...(raw as unknown as OrderRecord),
      shippingAddress,
      shippingCents,
      paymentReference,
      rushDays,
      rushCents,
    };
  }

  const legacyPriceCents = (raw.priceCents as number | null) ?? null;
  return {
    id: raw.id as string,
    createdAt: raw.createdAt as string,
    status: raw.status as OrderRecord["status"],
    name: raw.name as string,
    email: raw.email as string,
    phone: raw.phone as string,
    items: [
      {
        paperSize: raw.paperSize as PaperSize,
        theme: raw.theme as OrderTheme,
        description: (raw.description as string) ?? "",
        referenceFiles: (raw.referenceFiles as string[]) ?? [],
        quantity: 1,
        unitPriceCents: legacyPriceCents,
      },
    ],
    shippingAddress,
    shippingCents,
    totalPriceCents: legacyPriceCents,
    paymentReference: (raw.paymentReference ?? raw.stripeSessionId) as string | undefined,
    rushDays,
    rushCents,
  };
}

function orderPathname(id: string) {
  return `orders/${id}.json`;
}

async function readOrderJson(pathname: string): Promise<Record<string, unknown> | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function writeOrder(record: OrderRecord) {
  await put(orderPathname(record.id), JSON.stringify(record, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return record;
}

export async function createOrder(
  order: Omit<OrderRecord, "id" | "createdAt" | "status"> & {
    status?: OrderRecord["status"];
  }
) {
  const id = randomUUID();
  const record: OrderRecord = {
    ...order,
    id,
    createdAt: new Date().toISOString(),
    status: order.status ?? "pending_payment",
  };
  return writeOrder(record);
}

export async function updateOrderItems(id: string, items: OrderItem[]) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  record.items = items;
  return writeOrder(record);
}

export async function setOrderQuote(id: string, totalPriceCents: number) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  record.totalPriceCents = totalPriceCents;
  record.status = "pix_pending";
  return writeOrder(record);
}

export async function updateOrderStatus(
  id: string,
  status: OrderRecord["status"],
  paymentReference?: string
) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  record.status = status;
  if (paymentReference) record.paymentReference = paymentReference;
  if (status === "paid" && !record.paidAt) record.paidAt = new Date().toISOString();
  return writeOrder(record);
}

export async function setOrderNotes(id: string, notes: string) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  record.notes = notes.slice(0, 4000);
  return writeOrder(record);
}

export async function setOrderPaidAt(id: string, paidAt: string) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  const parsed = new Date(paidAt);
  if (Number.isNaN(parsed.getTime())) throw new Error("Data inválida.");
  record.paidAt = parsed.toISOString();
  return writeOrder(record);
}

export async function markReminderSent(id: string) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) return;
  const record = normalizeOrder(raw);
  record.reminderSentAt = new Date().toISOString();
  await writeOrder(record);
}

/**
 * Apaga blobs em `uploads/` que não pertencem a nenhum pedido — sobras de
 * upload feito mas pedido nunca finalizado (carrinho abandonado, ou alguém
 * batendo direto no endpoint de upload). Considera pedidos na lixeira também
 * (senão as fotos de um pedido excluído "por engano" seriam apagadas antes
 * de dar tempo de restaurar). Só considera blobs com mais de `minAgeMs` para
 * não apagar um upload que está no meio de um pedido sendo preenchido agora.
 */
export async function deleteOrphanUploads(minAgeMs = 48 * 60 * 60 * 1000) {
  const [{ blobs }, orders] = await Promise.all([list({ prefix: "uploads/" }), listAllOrders()]);

  const referenced = new Set(orders.flatMap((o) => o.items.flatMap((i) => i.referenceFiles)));
  const cutoff = Date.now() - minAgeMs;

  const orphans = blobs.filter(
    (b) => !referenced.has(b.pathname) && new Date(b.uploadedAt).getTime() < cutoff
  );

  if (orphans.length > 0) {
    await del(orphans.map((b) => b.pathname));
  }

  return orphans.length;
}

// "Excluir" move o pedido pra lixeira (soft delete) — as fotos e o registro
// continuam existindo, só saem da lista principal. Só some de vez com
// `permanentlyDeleteOrder` (manual, pela lixeira) ou `purgeOldTrash` (depois
// de muito tempo na lixeira).
export async function trashOrder(id: string) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  record.deletedAt = new Date().toISOString();
  return writeOrder(record);
}

export async function restoreOrder(id: string) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  delete record.deletedAt;
  return writeOrder(record);
}

export async function permanentlyDeleteOrder(id: string) {
  const raw = await readOrderJson(orderPathname(id));
  if (raw) {
    const record = normalizeOrder(raw);
    const filePaths = record.items
      .flatMap((item) => item.referenceFiles)
      .filter((path) => path.startsWith("uploads/"));
    if (filePaths.length > 0) {
      await del(filePaths).catch(() => {});
    }
  }
  await del(orderPathname(id));
}

// Esvazia sozinha a lixeira depois de muito tempo, pra não acumular pra
// sempre. Roda pela rotina diária (cron).
export async function purgeOldTrash(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  const trashed = await listTrashedOrders();
  const cutoff = Date.now() - maxAgeMs;
  const toPurge = trashed.filter(
    (o) => o.deletedAt && new Date(o.deletedAt).getTime() < cutoff
  );

  for (const order of toPurge) {
    await permanentlyDeleteOrder(order.id).catch(() => {});
  }

  return toPurge.length;
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  try {
    const raw = await readOrderJson(orderPathname(id));
    return raw ? normalizeOrder(raw) : null;
  } catch {
    return null;
  }
}

async function readAllOrderRecords(): Promise<OrderRecord[]> {
  const { blobs } = await list({ prefix: "orders/" });

  const orders = await Promise.all(
    blobs.map(async (b) => {
      try {
        const raw = await readOrderJson(b.pathname);
        return raw ? normalizeOrder(raw) : null;
      } catch {
        return null;
      }
    })
  );

  return orders.filter((o): o is OrderRecord => o !== null);
}

// Pedidos ativos (não excluídos) — é o que aparece na lista principal do
// admin, nos e-mails de lembrete e no backup semanal.
export async function listOrders(): Promise<OrderRecord[]> {
  const all = await readAllOrderRecords();
  return all.filter((o) => !o.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTrashedOrders(): Promise<OrderRecord[]> {
  const all = await readAllOrderRecords();
  return all
    .filter((o) => !!o.deletedAt)
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

// Ativos + lixeira juntos — usado internamente onde nada pode se perder
// (checagem de fotos órfãs, backup completo).
export async function listAllOrders(): Promise<OrderRecord[]> {
  const all = await readAllOrderRecords();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
