import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { listTrashedOrders } from "@/lib/orders";
import { isDevFallbackActive } from "@/lib/devMockOrders";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (isDevFallbackActive()) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await listTrashedOrders();
  return NextResponse.json({ orders });
}
