import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSession } from "@/lib/adminAuth";
import { listOrders } from "@/lib/orders";
import { isDevFallbackActive, DEV_FALLBACK_ORDERS } from "@/lib/devMockOrders";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (isDevFallbackActive()) {
    return NextResponse.json({ orders: DEV_FALLBACK_ORDERS });
  }

  const orders = await listOrders();
  return NextResponse.json({ orders });
}
