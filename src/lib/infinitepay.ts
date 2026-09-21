import { PAPER_SIZES, THEME_LABELS } from "./pricing";
import { getOrder, recordAutomaticPayment, type OrderRecord } from "./orders";
import { sendPaymentConfirmedEmail } from "./email";

const API_BASE = "https://api.checkout.infinitepay.io";

export type CheckoutItem = { quantity: number; price: number; description: string };

export function getInfinitePayHandle(): string | null {
  const handle = process.env.INFINITEPAY_HANDLE?.trim().replace(/^\$/, "");
  return handle || null;
}

export function buildCheckoutItems(order: OrderRecord): CheckoutItem[] {
  const total = order.totalPriceCents ?? 0;
  const items: CheckoutItem[] = [];

  for (const item of order.items) {
    if (item.unitPriceCents === null) continue;
    const size = PAPER_SIZES[item.paperSize as keyof typeof PAPER_SIZES]?.label ?? item.paperSize;
    const theme = THEME_LABELS[item.theme] ?? item.theme;
    items.push({
      quantity: item.quantity,
      price: item.unitPriceCents,
      description: `Aquarela ${size} - ${theme}`,
    });
  }
  if (order.rushCents > 0) {
    items.push({ quantity: 1, price: order.rushCents, description: "Taxa de prazo expresso" });
  }
  if (order.shippingCents > 0) {
    items.push({ quantity: 1, price: order.shippingCents, description: "Frete" });
  }

  const sum = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (items.length === 0 || sum !== total) {
    return [{ quantity: 1, price: total, description: "Aquarela personalizada - Canto e Cor" }];
  }
  return items;
}

export async function createCheckoutLink(
  handle: string,
  order: OrderRecord,
  origin: string
): Promise<string> {
  const phoneDigits = order.phone.replace(/\D/g, "");
  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle,
      order_nsu: order.id,
      items: buildCheckoutItems(order),
      redirect_url: `${origin}/pedido-pix?order_id=${order.id}`,
      webhook_url: `${origin}/api/webhooks/infinitepay`,
      address: {
        cep: order.shippingAddress.cep.replace(/\D/g, ""),
        street: order.shippingAddress.street,
        neighborhood: order.shippingAddress.neighborhood,
        number: order.shippingAddress.number,
        ...(order.shippingAddress.complement ? { complement: order.shippingAddress.complement } : {}),
      },
      customer: {
        name: order.name,
        email: order.email,
        ...(phoneDigits.length >= 10 ? { phone_number: `+55${phoneDigits.replace(/^55/, "")}` } : {}),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`InfinitePay respondeu ${res.status} ao criar o link: ${await res.text()}`);
  }
  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error("InfinitePay não retornou a URL do checkout.");
  return json.url;
}

export type PaymentCheck = {
  paid: boolean;
  amount: number;
  paidAmount: number;
  installments: number;
  captureMethod: string;
};

export async function checkPayment(params: {
  handle: string;
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<PaymentCheck> {
  const res = await fetch(`${API_BASE}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: params.handle,
      order_nsu: params.orderNsu,
      transaction_nsu: params.transactionNsu,
      slug: params.slug,
    }),
  });
  if (!res.ok) throw new Error(`InfinitePay respondeu ${res.status} ao verificar o pagamento.`);
  const json = (await res.json()) as {
    success?: boolean;
    paid?: boolean;
    amount?: number;
    paid_amount?: number;
    installments?: number;
    capture_method?: string;
  };
  return {
    paid: json.success === true && json.paid === true,
    amount: json.amount ?? 0,
    paidAmount: json.paid_amount ?? 0,
    installments: json.installments ?? 1,
    captureMethod: json.capture_method ?? "",
  };
}

export type ConfirmResult = "confirmed" | "already_paid" | "not_paid" | "invalid";

// O webhook da InfinitePay não tem assinatura, então nunca confiamos no corpo
// recebido: o pagamento só é registrado se a própria API confirmar (server to
// server) que esse order_nsu/transaction_nsu foi pago pelo valor do pedido.
export async function confirmInfinitePayPayment(params: {
  orderId: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string;
}): Promise<ConfirmResult> {
  const handle = getInfinitePayHandle();
  if (!handle) throw new Error("INFINITEPAY_HANDLE não configurada.");

  const order = await getOrder(params.orderId);
  if (!order || order.totalPriceCents === null) return "invalid";
  if (order.status === "paid" || order.status === "shipped") return "already_paid";

  const check = await checkPayment({
    handle,
    orderNsu: order.id,
    transactionNsu: params.transactionNsu,
    slug: params.slug,
  });
  if (!check.paid) return "not_paid";
  if (check.amount !== order.totalPriceCents) return "invalid";

  const { alreadyPaid } = await recordAutomaticPayment(order.id, {
    paymentReference: `infinitepay:${params.transactionNsu}`,
    paymentMethod: check.captureMethod === "credit_card" ? "credit_card" : "pix",
    installments: check.installments,
    receiptUrl: params.receiptUrl,
  });
  if (alreadyPaid) return "already_paid";

  try {
    await sendPaymentConfirmedEmail(order.email, order.name);
  } catch (error) {
    console.error("Falha ao enviar e-mail de pagamento confirmado", order.id, error);
  }
  return "confirmed";
}
