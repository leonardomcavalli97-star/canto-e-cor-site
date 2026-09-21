import { NextRequest, NextResponse } from "next/server";
import { confirmInfinitePayPayment } from "@/lib/infinitepay";

// Chamada pela página de retorno do checkout como reforço do webhook. Os
// parâmetros vêm do cliente, mas o pagamento só é registrado se a API da
// InfinitePay confirmar (ver confirmInfinitePayPayment).
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/infinitepay/confirm">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const transactionNsu = typeof body.transaction_nsu === "string" ? body.transaction_nsu : "";
  const slug = typeof body.slug === "string" ? body.slug : "";
  const receiptUrl = typeof body.receipt_url === "string" ? body.receipt_url : undefined;

  if (!transactionNsu || !slug) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  try {
    const result = await confirmInfinitePayPayment({
      orderId: id,
      transactionNsu,
      slug,
      receiptUrl,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Falha ao confirmar pagamento InfinitePay", id, error);
    return NextResponse.json({ error: "Não foi possível confirmar agora." }, { status: 502 });
  }
}
