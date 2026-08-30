import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { getOrder, setOrderQuote } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

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
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: amountCents,
            product_data: { name: "Aquarela personalizada · Canto e Cor" },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: id },
      success_url: `${origin}/pedido-confirmado?order_id=${id}`,
      cancel_url: `${origin}/pedido-cancelado?order_id=${id}`,
    });
    checkoutUrl = session.url;
  } catch {
    checkoutUrl = null;
  }

  return NextResponse.json({ pixUrl, checkoutUrl });
}
