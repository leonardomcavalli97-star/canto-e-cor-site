import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { getInfinitePayHandle } from "@/lib/infinitepay";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/payment">
) {
  const { id } = await ctx.params;
  const order = await getOrder(id);

  if (!order || order.totalPriceCents === null) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    amountCents: order.totalPriceCents,
    name: order.name,
    status: order.status,
    paymentAvailable: getInfinitePayHandle() !== null,
  });
}
