import { NextRequest, NextResponse } from "next/server";
import { getOrder, setOrderCoupon, getPayableAmountCents } from "@/lib/orders";
import { findCoupon, calculateDiscountCents, isCouponUsed } from "@/lib/coupons";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/coupon">
) {
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order || order.totalPriceCents === null) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.status === "paid" || order.status === "shipped") {
    return NextResponse.json({ error: "Este pedido já foi pago." }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Informe um cupom." }, { status: 400 });
  }

  const coupon = findCoupon(code);
  if (!coupon) {
    return NextResponse.json({ error: "Cupom inválido." }, { status: 404 });
  }
  if (order.couponCode !== coupon.code && (await isCouponUsed())) {
    return NextResponse.json({ error: "Este cupom já foi utilizado." }, { status: 409 });
  }

  const discountCents = calculateDiscountCents(order.totalPriceCents, coupon.percentOff);
  const updated = await setOrderCoupon(id, { code: coupon.code, discountCents });

  return NextResponse.json({
    couponCode: updated.couponCode,
    subtotalCents: updated.totalPriceCents,
    discountCents: updated.discountCents,
    amountCents: getPayableAmountCents(updated),
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/coupon">
) {
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.status === "paid" || order.status === "shipped") {
    return NextResponse.json({ error: "Este pedido já foi pago." }, { status: 409 });
  }

  const updated = await setOrderCoupon(id, null);
  return NextResponse.json({
    subtotalCents: updated.totalPriceCents,
    amountCents: getPayableAmountCents(updated),
  });
}
