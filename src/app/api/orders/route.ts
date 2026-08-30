import { NextRequest, NextResponse } from "next/server";
import {
  createOrder,
  saveReferenceFiles,
  updateOrderItems,
  type OrderItem,
  type OrderTheme,
} from "@/lib/orders";
import { PAPER_SIZES, type PaperSize } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

  const itemCount = parseInt(String(formData.get("itemCount") ?? "0"), 10);
  if (!itemCount || itemCount < 1 || itemCount > MAX_ITEMS) {
    return NextResponse.json(
      { error: "Adicione ao menos um desenho ao pedido." },
      { status: 400 }
    );
  }

  const items: OrderItem[] = [];
  const filesByItem: File[][] = [];

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

    const files = formData
      .getAll(`item_${i}_referenceFiles`)
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: `Envie ao menos uma foto de referência para o desenho ${i + 1}.` },
        { status: 400 }
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_FILES} fotos por desenho.` },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `O arquivo "${file.name}" excede 10MB.` },
          { status: 400 }
        );
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `O arquivo "${file.name}" precisa ser uma imagem.` },
          { status: 400 }
        );
      }
    }

    items.push({
      paperSize,
      theme,
      description,
      quantity,
      referenceFiles: [],
      unitPriceCents: PAPER_SIZES[paperSize].priceCents,
    });
    filesByItem.push(files);
  }

  const hasCustomItem = items.some((item) => item.unitPriceCents === null);
  const totalPriceCents = hasCustomItem
    ? null
    : items.reduce((sum, item) => sum + (item.unitPriceCents ?? 0) * item.quantity, 0);

  const order = await createOrder({
    name,
    email,
    phone,
    items,
    totalPriceCents,
    status:
      totalPriceCents === null
        ? "pending_quote"
        : paymentMethod === "pix"
          ? "pix_pending"
          : "pending_payment",
  });

  for (let i = 0; i < items.length; i++) {
    items[i].referenceFiles = await saveReferenceFiles(order.id, i, filesByItem[i]);
  }
  await updateOrderItems(order.id, items);

  if (totalPriceCents === null) {
    return NextResponse.json({ orderId: order.id, quotePending: true });
  }

  if (paymentMethod === "pix") {
    return NextResponse.json({ orderId: order.id, pixPending: true });
  }

  const origin = req.nextUrl.origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: items.map((item) => ({
        price_data: {
          currency: "brl",
          unit_amount: item.unitPriceCents!,
          product_data: {
            name: `Aquarela ${PAPER_SIZES[item.paperSize].label}`,
            description: `${PAPER_SIZES[item.paperSize].dimensions} · ${item.description}`.slice(0, 300),
          },
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id,
      },
      success_url: `${origin}/pedido-confirmado?order_id=${order.id}`,
      cancel_url: `${origin}/pedido-cancelado?order_id=${order.id}`,
    });

    return NextResponse.json({ checkoutUrl: session.url, orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao iniciar pagamento.";
    return NextResponse.json(
      { error: message, orderId: order.id, savedWithoutPayment: true },
      { status: 502 }
    );
  }
}
