import { NextRequest, NextResponse } from "next/server";
import { createOrder, type OrderItem, type OrderTheme, type ShippingAddress } from "@/lib/orders";
import { PAPER_SIZES, SHIPPING_FLAT_CENTS, isFreeShippingAddress, type PaperSize } from "@/lib/pricing";
import { createInfinitePayCheckout, type InfinitePayItem } from "@/lib/infinitepay";

const MAX_FILES = 5;
const MAX_ITEMS = 10;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "card") === "pix" ? "pix" : "card";

  if (!name || !email || !phone) {
    return NextResponse.json(
      { error: "Preencha todos os campos obrigatórios." },
      { status: 400 }
    );
  }

  const shippingAddress: ShippingAddress = {
    cep: String(formData.get("cep") ?? "").trim(),
    street: String(formData.get("street") ?? "").trim(),
    number: String(formData.get("number") ?? "").trim(),
    complement: String(formData.get("complement") ?? "").trim(),
    neighborhood: String(formData.get("neighborhood") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
  };

  if (
    shippingAddress.cep.replace(/\D/g, "").length !== 8 ||
    !shippingAddress.street ||
    !shippingAddress.number ||
    !shippingAddress.neighborhood ||
    !shippingAddress.city ||
    !shippingAddress.state
  ) {
    return NextResponse.json(
      { error: "Preencha o endereço de entrega completo." },
      { status: 400 }
    );
  }

  const itemCount = parseInt(String(formData.get("itemCount") ?? "0"), 10);
  if (!itemCount || itemCount < 1 || itemCount > MAX_ITEMS) {
    return NextResponse.json(
      { error: "Adicione ao menos um desenho ao pedido." },
      { status: 400 }
    );
  }

  const items: OrderItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const paperSize = String(formData.get(`item_${i}_paperSize`) ?? "") as PaperSize;
    const theme = String(formData.get(`item_${i}_theme`) ?? "outro") as OrderTheme;
    const description = String(formData.get(`item_${i}_description`) ?? "").trim();
    const quantity = Math.min(
      10,
      Math.max(1, parseInt(String(formData.get(`item_${i}_quantity`) ?? "1"), 10) || 1)
    );

    if (!PAPER_SIZES[paperSize]) {
      return NextResponse.json(
        { error: `Selecione um tamanho de papel válido para o desenho ${i + 1}.` },
        { status: 400 }
      );
    }
    if (!description) {
      return NextResponse.json(
        { error: `Descreva o desenho ${i + 1}.` },
        { status: 400 }
      );
    }

    let referenceFiles: string[] = [];
    try {
      const raw = JSON.parse(String(formData.get(`item_${i}_referenceFiles`) ?? "[]"));
      if (Array.isArray(raw)) {
        referenceFiles = raw.filter((url): url is string => typeof url === "string" && url.length > 0);
      }
    } catch {
      referenceFiles = [];
    }

    if (referenceFiles.length === 0) {
      return NextResponse.json(
        { error: `Envie ao menos uma foto de referência para o desenho ${i + 1}.` },
        { status: 400 }
      );
    }
    if (referenceFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_FILES} fotos por desenho.` },
        { status: 400 }
      );
    }

    items.push({
      paperSize,
      theme,
      description,
      quantity,
      referenceFiles,
      unitPriceCents: PAPER_SIZES[paperSize].priceCents,
    });
  }

  const hasCustomItem = items.some((item) => item.unitPriceCents === null);
  const shippingCents = isFreeShippingAddress(shippingAddress.city, shippingAddress.state)
    ? 0
    : SHIPPING_FLAT_CENTS;
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.unitPriceCents ?? 0) * item.quantity, 0);
  const totalPriceCents = hasCustomItem ? null : itemsSubtotal + shippingCents;

  const order = await createOrder({
    name,
    email,
    phone,
    items,
    shippingAddress,
    shippingCents,
    totalPriceCents,
    status:
      totalPriceCents === null
        ? "pending_quote"
        : paymentMethod === "pix"
          ? "pix_pending"
          : "pending_payment",
  });

  if (totalPriceCents === null) {
    return NextResponse.json({ orderId: order.id, quotePending: true });
  }

  if (paymentMethod === "pix") {
    return NextResponse.json({ orderId: order.id, pixPending: true });
  }

  const origin = req.nextUrl.origin;

  try {
    const infinitePayItems: InfinitePayItem[] = items.map((item, i) => ({
      id: String(i),
      description: `Aquarela ${PAPER_SIZES[item.paperSize].label} · ${item.description}`.slice(0, 100),
      quantity: item.quantity,
      price: item.unitPriceCents!,
    }));
    if (shippingCents > 0) {
      infinitePayItems.push({ id: "frete", description: "Frete", quantity: 1, price: shippingCents });
    }

    const checkoutUrl = await createInfinitePayCheckout({
      orderNsu: order.id,
      amountCents: totalPriceCents,
      items: infinitePayItems,
      customer: { name, email, phone },
      redirectUrl: `${origin}/pedido-confirmado?order_id=${order.id}`,
      webhookUrl: `${origin}/api/webhook/infinitepay`,
    });

    return NextResponse.json({ checkoutUrl, orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao iniciar pagamento.";
    return NextResponse.json(
      { error: message, orderId: order.id, savedWithoutPayment: true },
      { status: 502 }
    );
  }
}
