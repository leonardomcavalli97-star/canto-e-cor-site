export type Coupon = { code: string; percentOff: number };

const COUPONS: Coupon[] = [
  { code: "CANTOECOR10", percentOff: 10 },
  { code: "CANTOECOR15", percentOff: 15 },
  { code: "CANTOECOR20", percentOff: 20 },
];

export function findCoupon(input: string): Coupon | null {
  const normalized = input.trim().toUpperCase();
  return COUPONS.find((c) => c.code === normalized) ?? null;
}

export function calculateDiscountCents(subtotalCents: number, percentOff: number) {
  return Math.round((subtotalCents * percentOff) / 100);
}
