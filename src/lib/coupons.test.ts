import { describe, expect, it } from "vitest";
import { findCoupon, calculateDiscountCents } from "./coupons";

describe("findCoupon", () => {
  it("finds a known coupon by exact code", () => {
    expect(findCoupon("CANTOECOR10")?.percentOff).toBe(10);
    expect(findCoupon("CANTOECOR15")?.percentOff).toBe(15);
    expect(findCoupon("CANTOECOR20")?.percentOff).toBe(20);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(findCoupon("  cantoecor10  ")?.percentOff).toBe(10);
  });

  it("returns null for an unknown code", () => {
    expect(findCoupon("NAOEXISTE")).toBeNull();
  });
});

describe("calculateDiscountCents", () => {
  it("rounds to the nearest cent", () => {
    expect(calculateDiscountCents(18000, 10)).toBe(1800);
    expect(calculateDiscountCents(21000, 15)).toBe(3150);
    expect(calculateDiscountCents(9999, 20)).toBe(2000);
  });
});
