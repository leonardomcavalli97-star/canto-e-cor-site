import { randomUUID } from "crypto";
import { put, get, list } from "@vercel/blob";
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

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: "pending_payment" | "pending_quote" | "pix_pending" | "paid" | "cancelled";
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  totalPriceCents: number | null;
  stripeSessionId?: string;
}

// Pedidos criados antes da mudança para múltiplos desenhos guardavam os
// campos soltos (paperSize/theme/description/priceCents) em vez de `items`.
// Isso adapta esses registros antigos para o formato novo.
function normalizeOrder(raw: Record<string, unknown>): OrderRecord {
  if (Array.isArray(raw.items)) {
    return raw as unknown as OrderRecord;
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
    totalPriceCents: legacyPriceCents,
    stripeSessionId: raw.stripeSessionId as string | undefined,
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

export async function saveReferenceFiles(orderId: string, itemIndex: number, files: File[]) {
  const savedPaths: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const pathname = `uploads/${orderId}/item-${itemIndex}/${randomUUID()}-${safeName}`;
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
    });
    savedPaths.push(blob.pathname);
  }
  return savedPaths;
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

export async function updateOrderStatus(
  id: string,
  status: OrderRecord["status"],
  stripeSessionId?: string
) {
  const raw = await readOrderJson(orderPathname(id));
  if (!raw) throw new Error("Pedido não encontrado.");
  const record = normalizeOrder(raw);
  record.status = status;
  if (stripeSessionId) record.stripeSessionId = stripeSessionId;
  return writeOrder(record);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  try {
    const raw = await readOrderJson(orderPathname(id));
    return raw ? normalizeOrder(raw) : null;
  } catch {
    return null;
  }
}

export async function listOrders(): Promise<OrderRecord[]> {
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

  return orders
    .filter((o): o is OrderRecord => o !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
