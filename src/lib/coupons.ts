import { get, put } from "@vercel/blob";

export type Coupon = { code: string; percentOff: number };

const COUPON: Coupon = { code: "ATELIE10", percentOff: 10 };

export function findCoupon(input: string): Coupon | null {
  return input.trim().toUpperCase() === COUPON.code ? COUPON : null;
}

export function calculateDiscountCents(subtotalCents: number, percentOff: number) {
  return Math.round((subtotalCents * percentOff) / 100);
}

// O cupom é de uso único: depois que um pedido paga com ele, fica marcado
// aqui e nenhum outro pedido consegue aplicá-lo de novo. Guardamos num blob
// à parte (e não num campo de order) porque precisa ser consultável sem
// saber de antemão qual pedido usou.
const USAGE_PATHNAME = "coupons/atelie10-usage.json";

type CouponUsage = { orderId: string; usedAt: string };

async function readUsage(): Promise<CouponUsage | null> {
  const result = await get(USAGE_PATHNAME, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

export async function isCouponUsed(): Promise<boolean> {
  return (await readUsage()) !== null;
}

export async function markCouponUsed(orderId: string) {
  const usage: CouponUsage = { orderId, usedAt: new Date().toISOString() };
  await put(USAGE_PATHNAME, JSON.stringify(usage, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
