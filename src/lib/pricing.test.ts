import { describe, expect, it } from "vitest";
import {
  PAPER_SIZES,
  RUSH_OPTIONS,
  getRushOption,
  multiplyRushCents,
  isFreeShippingAddress,
  formatBRL,
  formatPrice,
  SHIPPING_FLAT_CENTS,
} from "./pricing";

describe("PAPER_SIZES", () => {
  it("A4 costs more than A5", () => {
    expect(PAPER_SIZES.A4.priceCents!).toBeGreaterThan(PAPER_SIZES.A5.priceCents!);
  });

  it("personalizado has no fixed price (quote needed)", () => {
    expect(PAPER_SIZES.personalizado.priceCents).toBeNull();
  });
});

describe("getRushOption", () => {
  it("finds the option by value", () => {
    expect(getRushOption("5d").days).toBe(5);
    expect(getRushOption("5d").priceCents).toBe(8000);
  });

  it("falls back to the first option (standard) for an unknown value", () => {
    expect(getRushOption("nao-existe")).toBe(RUSH_OPTIONS[0]);
    expect(getRushOption("nao-existe").value).toBe("standard");
  });

  it("standard is free and has no deadline", () => {
    const standard = getRushOption("standard");
    expect(standard.priceCents).toBe(0);
    expect(standard.days).toBeNull();
  });
});

describe("multiplyRushCents", () => {
  it("charges the rush fee once for a single piece", () => {
    expect(multiplyRushCents(4000, 1)).toBe(4000);
  });

  it("multiplies the per-piece rush fee by the total piece count", () => {
    // Regression test: the rush fee used to be charged once per order
    // regardless of how many pieces were in it, which undercharged
    // multi-item/multi-quantity orders. See getRushOption("10d").
    expect(multiplyRushCents(4000, 3)).toBe(12000);
    expect(multiplyRushCents(8000, 5)).toBe(40000);
  });

  it("never charges for less than one piece, even if pieceCount is 0", () => {
    expect(multiplyRushCents(4000, 0)).toBe(4000);
  });

  it("a free (standard) rush option stays free no matter the piece count", () => {
    expect(multiplyRushCents(0, 10)).toBe(0);
  });
});

describe("isFreeShippingAddress", () => {
  it("is free for Campo Grande - MS", () => {
    expect(isFreeShippingAddress("Campo Grande", "MS")).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(isFreeShippingAddress("  campo grande  ", " ms ")).toBe(true);
    expect(isFreeShippingAddress("CAMPO GRANDE", "ms")).toBe(true);
  });

  it("charges shipping for any other city", () => {
    expect(isFreeShippingAddress("São Paulo", "SP")).toBe(false);
  });

  it("charges shipping for an empty address", () => {
    expect(isFreeShippingAddress("", "")).toBe(false);
  });
});

describe("formatBRL / formatPrice", () => {
  it("formats cents as Brazilian currency", () => {
    expect(formatBRL(21000)).toContain("210,00");
  });

  it("shows a quote message instead of a price when cents is null", () => {
    expect(formatPrice(null)).toBe("Valor a combinar");
  });

  it("formats a real price normally", () => {
    expect(formatPrice(SHIPPING_FLAT_CENTS)).toContain("25,00");
  });
});
