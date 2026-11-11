import { NextRequest, NextResponse } from "next/server";
import { getOrder, getPayableAmountCents, setOrderCoupon } from "@/lib/orders";
import { createCheckoutLink, getInfinitePayHandle } from "@/lib/infinitepay";
import { couponUnavailableMessage, releaseCoupon, reserveCoupon } from "@/lib/coupons";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/infinitepay">
) {
  const handle = getInfinitePayHandle();
  if (!handle) {
    return NextResponse.json({ error: "Pagamento por cartão indisponível." }, { status: 503 });
  }

  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order || order.totalPriceCents === null) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.status !== "pix_pending" && order.status !== "pending_payment") {
    return NextResponse.json({ error: "Este pedido não está aguardando pagamento." }, { status: 409 });
  }

  try {
    // Antes de gerar um link com desconto, confere se o cupom ainda vale
    // (validade e, nos de uso único, reserva para este pedido). Se expirou ou
    // outro pedido já pagou/está com ele, o desconto sai do pedido e a pessoa
    // vê o valor atualizado antes de pagar.
    if (order.couponCode) {
      const reservation = await reserveCoupon(order.couponCode, order.id);
      if (!reservation.ok) {
        const updated = await setOrderCoupon(order.id, null);
        return NextResponse.json(
          {
            error: `${couponUnavailableMessage(reservation.reason)} O valor foi atualizado.`,
            couponRemoved: true,
            couponCode: null,
            subtotalCents: updated.totalPriceCents,
            discountCents: 0,
            amountCents: getPayableAmountCents(updated),
          },
          { status: 409 }
        );
      }
    }

    const url = await createCheckoutLink(handle, order, req.nextUrl.origin);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Falha ao criar link InfinitePay", id, error);
    if (order.couponCode) {
      await releaseCoupon(order.couponCode, order.id).catch(() => {});
    }
    return NextResponse.json(
      { error: "Não foi possível abrir o pagamento agora. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
