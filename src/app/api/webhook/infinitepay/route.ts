import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  if (!data) {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const orderId = typeof data.order_nsu === "string" ? data.order_nsu : null;
  const transactionNsu = typeof data.transaction_nsu === "string" ? data.transaction_nsu : undefined;
  const amount = Number(data.amount ?? 0);
  const paidAmount = Number(data.paid_amount ?? 0);

  if (!orderId) {
    return NextResponse.json({ error: "order_nsu ausente." }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (order.status !== "paid" && order.status !== "shipped" && paidAmount > 0 && paidAmount >= amount) {
    await updateOrderStatus(orderId, "paid", transactionNsu);
  }

  return NextResponse.json({ ok: true });
}
