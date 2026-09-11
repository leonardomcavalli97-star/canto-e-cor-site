import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { PAPER_SIZES, THEME_LABELS, formatPrice, type PaperSize } from "@/lib/pricing";

const STATUS_LABELS: Record<string, string> = {
  pending_quote: "Aguardando orçamento",
  pending_payment: "Aguardando pagamento",
  pix_pending: "Aguardando pagamento (Pix)",
  paid: "Pago · em produção",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]/status">) {
  const { id } = await ctx.params;
  const order = await getOrder(id);

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const items = order.items.map((item) => ({
    size: PAPER_SIZES[item.paperSize as PaperSize]?.label ?? item.paperSize,
    theme: THEME_LABELS[item.theme] ?? item.theme,
    quantity: item.quantity,
  }));

  return NextResponse.json({
    name: order.name,
    createdAt: order.createdAt,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] ?? order.status,
    items,
    totalPriceCents: order.totalPriceCents,
    totalPriceLabel: formatPrice(order.totalPriceCents),
    paidAt: order.paidAt ?? null,
    rushDays: order.rushDays,
  });
}
