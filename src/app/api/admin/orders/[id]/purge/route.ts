import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { permanentlyDeleteOrder } from "@/lib/orders";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/purge">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  await permanentlyDeleteOrder(id);
  return NextResponse.json({ ok: true });
}
