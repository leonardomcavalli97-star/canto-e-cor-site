import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";

export type Coupon = {
  code: string;
  percentOff: number;
  // Uso único: depois que um pedido paga com o cupom, ninguém mais usa.
  singleUse: boolean;
  // Último instante em que o cupom vale (ISO com fuso). Sem isso, não expira.
  expiresAt?: string;
};

// O desconto é sempre sobre o total do pedido (peças + frete + prazo).
const COUPONS: Coupon[] = [
  { code: "ATELIE10", percentOff: 10, singleUse: true },
  // Vale até o fim do dia 15/11/2026 no horário de Campo Grande (UTC-4).
  { code: "SORELLAS10", percentOff: 10, singleUse: false, expiresAt: "2026-11-15T23:59:59.999-04:00" },
];

export function findCoupon(input: string): Coupon | null {
  const code = input.trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === code) ?? null;
}

export function isCouponExpired(coupon: Coupon, now = Date.now()) {
  return coupon.expiresAt !== undefined && now > Date.parse(coupon.expiresAt);
}

export function calculateDiscountCents(subtotalCents: number, percentOff: number) {
  return Math.round((subtotalCents * percentOff) / 100);
}

// Cupons de uso único passam por dois estados, guardados em blobs à parte (e
// não num campo de order) porque precisam ser consultáveis sem saber de
// antemão qual pedido está com o cupom:
//
//  - RESERVA: quando o link de pagamento de um pedido com cupom é criado, o
//    cupom fica reservado para aquele pedido. Enquanto a reserva vale, nenhum
//    outro pedido consegue aplicar nem pagar com ele. Ela expira sozinha
//    (RESERVATION_TTL_MS) para um pedido abandonado não prender o cupom.
//  - USO: quando o pedido é pago, o cupom vira "usado" para sempre.
//
// A reserva é criada com `put` sem `allowOverwrite` (falha se já existir) e
// trocada/removida com `ifMatch` (só se ninguém mexeu desde a leitura), então
// dois pedidos simultâneos nunca saem os dois com o cupom.
//
// Cupons de uso ilimitado não guardam nada: só a validade é conferida.
function usagePathname(coupon: Coupon) {
  return `coupons/${coupon.code.toLowerCase()}-usage.json`;
}

function reservationPathname(coupon: Coupon) {
  return `coupons/${coupon.code.toLowerCase()}-reservation.json`;
}

export const RESERVATION_TTL_MS = 30 * 60 * 1000;

type CouponUsage = { orderId: string; usedAt: string };
type CouponReservation = { orderId: string; reservedAt: string };

export type CouponUnavailableReason = "used" | "reserved" | "expired" | "invalid";
export type CouponAvailability = "available" | CouponUnavailableReason;
export type ReserveResult = { ok: true } | { ok: false; reason: CouponUnavailableReason };

const PUT_OPTIONS = {
  access: "private",
  addRandomSuffix: false,
  contentType: "application/json",
} as const;

async function readBlobJson<T>(pathname: string): Promise<{ data: T; etag: string } | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const data = JSON.parse(await new Response(result.stream).text()) as T;
  return { data, etag: result.blob.etag };
}

function isReservationExpired(reservation: CouponReservation, now: number) {
  return now - Date.parse(reservation.reservedAt) > RESERVATION_TTL_MS;
}

export function couponUnavailableMessage(reason: CouponUnavailableReason) {
  switch (reason) {
    case "used":
      return "Este cupom já foi utilizado.";
    case "reserved":
      return "Este cupom está em uso em outro pedido. Tente de novo em alguns minutos.";
    case "expired":
      return "Este cupom expirou.";
    case "invalid":
      return "Cupom inválido.";
  }
}

// Situação do cupom do ponto de vista de um pedido: um cupom reservado para o
// próprio pedido continua "available" para ele.
export async function getCouponAvailability(
  code: string,
  orderId: string,
  now = Date.now()
): Promise<CouponAvailability> {
  const coupon = findCoupon(code);
  if (!coupon) return "invalid";
  if (isCouponExpired(coupon, now)) return "expired";
  if (!coupon.singleUse) return "available";

  if (await readBlobJson<CouponUsage>(usagePathname(coupon))) return "used";
  const reservation = await readBlobJson<CouponReservation>(reservationPathname(coupon));
  if (
    reservation &&
    reservation.data.orderId !== orderId &&
    !isReservationExpired(reservation.data, now)
  ) {
    return "reserved";
  }
  return "available";
}

// Chamada quando o link de pagamento vai ser criado. Para cupom de uso único
// reserva o cupom para o pedido; para os demais só confere a validade.
export async function reserveCoupon(
  code: string,
  orderId: string,
  now = Date.now()
): Promise<ReserveResult> {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, reason: "invalid" };
  if (isCouponExpired(coupon, now)) return { ok: false, reason: "expired" };
  if (!coupon.singleUse) return { ok: true };

  const usagePath = usagePathname(coupon);
  const reservationPath = reservationPathname(coupon);

  if (await readBlobJson<CouponUsage>(usagePath)) return { ok: false, reason: "used" };

  const body = JSON.stringify({ orderId, reservedAt: new Date(now).toISOString() });
  const existing = await readBlobJson<CouponReservation>(reservationPath);

  if (!existing) {
    try {
      await put(reservationPath, body, PUT_OPTIONS); // falha se já existir
    } catch (error) {
      // Outro pedido criou a reserva entre a nossa leitura e a nossa escrita.
      if (await readBlobJson(reservationPath)) return { ok: false, reason: "reserved" };
      throw error;
    }
  } else {
    const holdsIt = existing.data.orderId === orderId;
    if (!holdsIt && !isReservationExpired(existing.data, now)) {
      return { ok: false, reason: "reserved" };
    }

    // Renova a própria reserva ou assume uma expirada — só se ninguém mexeu nela.
    try {
      await put(reservationPath, body, { ...PUT_OPTIONS, ifMatch: existing.etag });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) return { ok: false, reason: "reserved" };
      throw error;
    }
  }

  // Se o cupom foi pago por outro pedido enquanto reservávamos, desfaz. (Quem
  // paga grava o uso ANTES de soltar a reserva, então essa checagem fecha a
  // corrida.)
  if (await readBlobJson<CouponUsage>(usagePath)) {
    await releaseCoupon(coupon.code, orderId).catch(() => {});
    return { ok: false, reason: "used" };
  }
  return { ok: true };
}

// Solta a reserva, mas só se for deste pedido (nunca a de outro).
export async function releaseCoupon(code: string, orderId: string) {
  const coupon = findCoupon(code);
  if (!coupon || !coupon.singleUse) return;

  const reservationPath = reservationPathname(coupon);
  const existing = await readBlobJson<CouponReservation>(reservationPath);
  if (!existing || existing.data.orderId !== orderId) return;
  try {
    await del(reservationPath, { ifMatch: existing.etag });
  } catch (error) {
    // Alguém assumiu a reserva nesse meio-tempo: não é mais nossa para soltar.
    if (!(error instanceof BlobPreconditionFailedError)) throw error;
  }
}

// Chamada quando o pedido é pago. Só faz algo para cupom de uso único.
export async function markCouponUsed(code: string, orderId: string) {
  const coupon = findCoupon(code);
  if (!coupon || !coupon.singleUse) return;

  const usagePath = usagePathname(coupon);
  const existing = await readBlobJson<CouponUsage>(usagePath);
  if (existing && existing.data.orderId !== orderId) {
    // Dois pedidos pagaram com o mesmo cupom (só acontece se a reserva expirou
    // antes do pagamento). O dinheiro já entrou, então mantemos o primeiro uso
    // e deixamos o aviso no log.
    console.error("Cupom usado em dois pedidos", coupon.code, existing.data.orderId, orderId);
  } else if (!existing) {
    const usage: CouponUsage = { orderId, usedAt: new Date().toISOString() };
    await put(usagePath, JSON.stringify(usage, null, 2), {
      ...PUT_OPTIONS,
      allowOverwrite: true,
    });
  }
  await releaseCoupon(coupon.code, orderId);
}
