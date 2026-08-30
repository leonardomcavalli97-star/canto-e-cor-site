import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { buildPix } from "@/lib/pix";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/pix">
) {
  const { id } = await ctx.params;
  const order = await getOrder(id);

  if (!order || order.totalPriceCents === null) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const { brCode, qrCodeImage } = await buildPix({
    amountCents: order.totalPriceCents,
    txid: order.id,
  });

  return NextResponse.json({
    brCode,
    qrCodeImage,
    amountCents: order.totalPriceCents,
    name: order.name,
    status: order.status,
  });
}
