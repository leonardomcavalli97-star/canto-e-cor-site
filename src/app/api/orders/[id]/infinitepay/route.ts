import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { createCheckoutLink, getInfinitePayHandle } from "@/lib/infinitepay";

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
    const url = await createCheckoutLink(handle, order, req.nextUrl.origin);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Falha ao criar link InfinitePay", id, error);
    return NextResponse.json(
      { error: "Não foi possível abrir o pagamento agora. Tente novamente ou pague com Pix." },
      { status: 502 }
    );
  }
}
