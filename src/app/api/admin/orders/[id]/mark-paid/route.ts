import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { updateOrderStatus } from "@/lib/orders";
import { sendPaymentConfirmedEmail } from "@/lib/email";
import { markCouponUsed } from "@/lib/coupons";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/mark-paid">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const order = await updateOrderStatus(id, "paid");
  // Pagamento registrado à mão também gasta o cupom (uso único).
  if (order.couponCode) {
    await markCouponUsed(order.couponCode, id).catch((error) => {
      console.error("Falha ao marcar cupom como usado", id, error);
    });
  }
  try {
    await sendPaymentConfirmedEmail(order.email, order.name);
  } catch (error) {
    console.error("Falha ao enviar e-mail de pagamento confirmado", id, error);
  }
  return NextResponse.json({ ok: true });
}
