import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { updateOrderStatus, setOrderTracking } from "@/lib/orders";
import { sendOrderShippedEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/mark-shipped">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const trackingCode = typeof body.trackingCode === "string" ? body.trackingCode.trim() : "";

  if (trackingCode) await setOrderTracking(id, trackingCode);
  const order = await updateOrderStatus(id, "shipped");
  try {
    await sendOrderShippedEmail(order.email, order.name, order.trackingCode);
  } catch (error) {
    console.error("Falha ao enviar e-mail de pedido enviado", id, error);
  }
  return NextResponse.json({ ok: true });
}
