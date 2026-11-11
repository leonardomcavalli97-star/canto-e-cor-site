import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { updateOrderStatus } from "@/lib/orders";
import { releaseCoupon } from "@/lib/coupons";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/cancel">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const order = await updateOrderStatus(id, "cancelled");
  // Pedido cancelado não vai pagar: devolve o cupom reservado, se houver.
  if (order.couponCode) {
    await releaseCoupon(order.couponCode, id).catch((error) => {
      console.error("Falha ao liberar a reserva do cupom", id, error);
    });
  }
  return NextResponse.json({ ok: true });
}
