import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { listOrders } from "@/lib/orders";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const orders = await listOrders();
  return NextResponse.json({ orders });
}
