import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, readdir } from "fs/promises";
import path from "path";
import type { PaperSize } from "./pricing";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_DIR = path.join(DATA_DIR, "orders");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

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
// Isso adapta esses registros antigos para o formato novo, sem precisar
// reescrever os arquivos já salvos em disco.
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

export async function saveReferenceFiles(orderId: string, itemIndex: number, files: File[]) {
  const itemUploadsDir = path.join(UPLOADS_DIR, orderId, `item-${itemIndex}`);
  await mkdir(itemUploadsDir, { recursive: true });

  const savedPaths: string[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `${randomUUID()}-${safeName}`;
    await writeFile(path.join(itemUploadsDir, fileName), buffer);
    savedPaths.push(`data/uploads/${orderId}/item-${itemIndex}/${fileName}`);
  }
  return savedPaths;
}

export async function createOrder(
  order: Omit<OrderRecord, "id" | "createdAt" | "status"> & {
    status?: OrderRecord["status"];
  }
) {
  await mkdir(ORDERS_DIR, { recursive: true });
  const id = randomUUID();
  const record: OrderRecord = {
    ...order,
    id,
    createdAt: new Date().toISOString(),
    status: order.status ?? "pending_payment",
  };
  await writeFile(
    path.join(ORDERS_DIR, `${id}.json`),
    JSON.stringify(record, null, 2)
  );
  return record;
}

export async function updateOrderItems(id: string, items: OrderItem[]) {
  const filePath = path.join(ORDERS_DIR, `${id}.json`);
  const raw = await readFile(filePath, "utf-8");
  const record: OrderRecord = JSON.parse(raw);
  record.items = items;
  await writeFile(filePath, JSON.stringify(record, null, 2));
  return record;
}

export async function updateOrderStatus(
  id: string,
  status: OrderRecord["status"],
  stripeSessionId?: string
) {
  const filePath = path.join(ORDERS_DIR, `${id}.json`);
  const raw = await readFile(filePath, "utf-8");
  const record: OrderRecord = JSON.parse(raw);
  record.status = status;
  if (stripeSessionId) record.stripeSessionId = stripeSessionId;
  await writeFile(filePath, JSON.stringify(record, null, 2));
  return record;
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  try {
    const raw = await readFile(path.join(ORDERS_DIR, `${id}.json`), "utf-8");
    return normalizeOrder(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function listOrders(): Promise<OrderRecord[]> {
  let files: string[];
  try {
    files = await readdir(ORDERS_DIR);
  } catch {
    return [];
  }

  const orders = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => normalizeOrder(JSON.parse(await readFile(path.join(ORDERS_DIR, f), "utf-8"))))
  );

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
