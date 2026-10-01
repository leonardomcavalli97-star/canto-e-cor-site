import { describe, expect, it } from "vitest";
import { findCoupon, calculateDiscountCents } from "./coupons";

describe("findCoupon", () => {
  it("finds the coupon by exact code", () => {
    expect(findCoupon("ATELIE10")?.percentOff).toBe(10);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(findCoupon("  atelie10  ")?.percentOff).toBe(10);
  });

  it("returns null for an unknown code", () => {
    expect(findCoupon("NAOEXISTE")).toBeNull();
  });
});

describe("calculateDiscountCents", () => {
  it("rounds to the nearest cent", () => {
    expect(calculateDiscountCents(18000, 10)).toBe(1800);
    expect(calculateDiscountCents(21000, 10)).toBe(2100);
    expect(calculateDiscountCents(9999, 10)).toBe(1000);
  });
});
