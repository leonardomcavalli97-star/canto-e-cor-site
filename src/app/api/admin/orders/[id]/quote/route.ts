import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { getOrder, setOrderQuote } from "@/lib/orders";
import { createInfinitePayCheckout } from "@/lib/infinitepay";
import { sendQuoteReadyEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/quote">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const amountCents = Math.round(Number(body.amountReais) * 100);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  await setOrderQuote(id, amountCents);

  const origin = req.nextUrl.origin;
  const pixUrl = `${origin}/pedido-pix?order_id=${id}`;

  let checkoutUrl: string | null = null;
  try {
    checkoutUrl = await createInfinitePayCheckout({
      orderNsu: id,
      amountCents,
      items: [{ id: "personalizado", description: "Aquarela personalizada · Canto e Cor", quantity: 1, price: amountCents }],
      customer: { name: order.name, email: order.email, phone: order.phone },
      redirectUrl: `${origin}/pedido-confirmado?order_id=${id}`,
      webhookUrl: `${origin}/api/webhook/infinitepay`,
    });
  } catch {
    checkoutUrl = null;
  }

  await sendQuoteReadyEmail(order.email, order.name, amountCents, pixUrl, checkoutUrl);

  return NextResponse.json({ pixUrl, checkoutUrl });
}
