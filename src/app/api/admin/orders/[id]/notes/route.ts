import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { setOrderNotes } from "@/lib/orders";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]/notes">
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const notes = typeof body.notes === "string" ? body.notes : "";

  await setOrderNotes(id, notes);
  return NextResponse.json({ ok: true });
}
