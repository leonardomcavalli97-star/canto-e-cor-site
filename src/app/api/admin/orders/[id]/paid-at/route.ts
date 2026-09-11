import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { setOrderPaidAt } from "@/lib/orders";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/paid-at">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const paidAt = typeof body.paidAt === "string" ? body.paidAt : "";

  if (!paidAt) {
    return NextResponse.json({ error: "Informe uma data." }, { status: 400 });
  }

  try {
    await setOrderPaidAt(id, paidAt);
  } catch {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
