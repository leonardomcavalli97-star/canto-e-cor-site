const API_BASE = "https://api.infinitepay.io/invoices/public/checkout";

function getHandle() {
  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) {
    throw new Error(
      "INFINITEPAY_HANDLE não configurada. Adicione o seu handle (@tag) da InfinitePay no .env.local."
    );
  }
  return handle;
}

function requestHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.INFINITEPAY_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

export interface InfinitePayItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export async function createInfinitePayCheckout({
  orderNsu,
  amountCents,
  items,
  customer,
  redirectUrl,
  webhookUrl,
}: {
  orderNsu: string;
  amountCents: number;
  items: InfinitePayItem[];
  customer: { name: string; email: string; phone?: string };
  redirectUrl: string;
  webhookUrl: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      handle: getHandle(),
      order_nsu: orderNsu,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      amount: amountCents,
      customer,
      items,
    }),
  });

  const data = await res.json().catch(() => ({}));
  const checkoutUrl = data.url ?? data.payment_url;

  if (!res.ok || !checkoutUrl) {
    throw new Error(data.error ?? "Erro ao gerar link de pagamento na InfinitePay.");
  }

  return checkoutUrl as string;
}

export async function checkInfinitePayPayment({
  orderNsu,
  transactionNsu,
  slug,
}: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<{ paid: boolean; installments?: number }> {
  const res = await fetch(`${API_BASE}/payment_check`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      handle: getHandle(),
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { paid: data.paid === true, installments: data.installments };
}
