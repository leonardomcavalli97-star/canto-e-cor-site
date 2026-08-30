import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { updateOrderStatus } from "@/lib/orders";

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
  await updateOrderStatus(id, "paid");
  return NextResponse.json({ ok: true });
}
