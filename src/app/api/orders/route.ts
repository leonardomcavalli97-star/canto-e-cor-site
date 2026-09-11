import { NextRequest, NextResponse } from "next/server";
import { createOrder, type OrderItem, type OrderTheme, type ShippingAddress } from "@/lib/orders";
import {
  PAPER_SIZES,
  SHIPPING_FLAT_CENTS,
  isFreeShippingAddress,
  getRushOption,
  multiplyRushCents,
  type PaperSize,
} from "@/lib/pricing";
import { sendNewOrderNotificationEmail, sendOrderReceivedEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

const MAX_FILES = 5;
const MAX_ITEMS = 10;
const UPLOAD_PREFIX = "uploads/";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clip(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "orders", 8, 10 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();

    const name = clip(String(formData.get("name") ?? "").trim(), 200);
    const email = clip(String(formData.get("email") ?? "").trim(), 254);
    const phone = clip(String(formData.get("phone") ?? "").trim(), 30);

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 });
    }

    const shippingAddress: ShippingAddress = {
      cep: clip(String(formData.get("cep") ?? "").trim(), 12),
      street: clip(String(formData.get("street") ?? "").trim(), 200),
      number: clip(String(formData.get("number") ?? "").trim(), 20),
      complement: clip(String(formData.get("complement") ?? "").trim(), 200),
      neighborhood: clip(String(formData.get("neighborhood") ?? "").trim(), 200),
      city: clip(String(formData.get("city") ?? "").trim(), 200),
      state: clip(String(formData.get("state") ?? "").trim(), 100),
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
        { error: "Adicione ao menos um desenho ao pedido (máximo de 10)." },
        { status: 400 }
      );
    }

    const items: OrderItem[] = [];

    for (let i = 0; i < itemCount; i++) {
      const paperSize = String(formData.get(`item_${i}_paperSize`) ?? "") as PaperSize;
      const theme = String(formData.get(`item_${i}_theme`) ?? "outro") as OrderTheme;
      const description = clip(String(formData.get(`item_${i}_description`) ?? "").trim(), 2000);
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
          referenceFiles = raw.filter(
            (url): url is string =>
              typeof url === "string" && url.length > 0 && url.startsWith(UPLOAD_PREFIX)
          );
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

    const rushOption = getRushOption(String(formData.get("rushOption") ?? "standard"));
    const totalPieceCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const rushCents = multiplyRushCents(rushOption.priceCents, totalPieceCount);

    const hasCustomItem = items.some((item) => item.unitPriceCents === null);
    const shippingCents = isFreeShippingAddress(shippingAddress.city, shippingAddress.state)
      ? 0
      : SHIPPING_FLAT_CENTS;
    const itemsSubtotal = items.reduce((sum, item) => sum + (item.unitPriceCents ?? 0) * item.quantity, 0);
    const totalPriceCents = hasCustomItem ? null : itemsSubtotal + shippingCents + rushCents;

    const order = await createOrder({
      name,
      email,
      phone,
      items,
      shippingAddress,
      shippingCents,
      totalPriceCents,
      rushDays: rushOption.days,
      rushCents,
      status: totalPriceCents === null ? "pending_quote" : "pix_pending",
    });

    try {
      await sendNewOrderNotificationEmail(name);
    } catch (error) {
      console.error("Falha ao enviar e-mail de notificação de novo pedido", order.id, error);
    }

    try {
      const statusUrl = `${req.nextUrl.origin}/pedido/status/${order.id}`;
      await sendOrderReceivedEmail(email, name, statusUrl);
    } catch (error) {
      console.error("Falha ao enviar e-mail de pedido recebido", order.id, error);
    }

    if (totalPriceCents === null) {
      return NextResponse.json({ orderId: order.id, quotePending: true });
    }

    return NextResponse.json({ orderId: order.id, pixPending: true });
  } catch (error) {
    console.error("Falha ao criar pedido", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o pedido. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
