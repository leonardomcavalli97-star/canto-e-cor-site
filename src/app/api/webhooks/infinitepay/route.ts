import { NextRequest, NextResponse } from "next/server";
import { confirmInfinitePayPayment } from "@/lib/infinitepay";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "JSON inválido." }, { status: 400 });
  }

  const orderId = typeof body.order_nsu === "string" ? body.order_nsu : "";
  const transactionNsu = typeof body.transaction_nsu === "string" ? body.transaction_nsu : "";
  const slug = typeof body.invoice_slug === "string" ? body.invoice_slug : "";
  const receiptUrl = typeof body.receipt_url === "string" ? body.receipt_url : undefined;

  if (!orderId || !transactionNsu || !slug) {
    return NextResponse.json({ success: false, message: "Dados incompletos." }, { status: 400 });
  }

  try {
    const result = await confirmInfinitePayPayment({ orderId, transactionNsu, slug, receiptUrl });
    if (result === "confirmed" || result === "already_paid") {
      return NextResponse.json({ success: true, message: null });
    }
    return NextResponse.json(
      { success: false, message: "Pagamento não confirmado." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Falha ao processar webhook InfinitePay", orderId, error);
    return NextResponse.json({ success: false, message: "Erro ao processar." }, { status: 400 });
  }
}
