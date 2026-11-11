import { beforeEach, describe, expect, it, vi } from "vitest";

// Blob em memória com as mesmas regras que a lógica do cupom usa do Vercel
// Blob: `put` sem allowOverwrite falha se o arquivo existe, e `put`/`del` com
// ifMatch só funcionam se o ETag ainda for o que foi lido.
const blob = vi.hoisted(() => {
  const store = new Map<string, { body: string; etag: number }>();
  let counter = 0;
  class BlobError extends Error {}
  class BlobPreconditionFailedError extends BlobError {}
  return { store, next: () => ++counter, BlobError, BlobPreconditionFailedError };
});

vi.mock("@vercel/blob", () => ({
  BlobError: blob.BlobError,
  BlobPreconditionFailedError: blob.BlobPreconditionFailedError,
  get: async (pathname: string) => {
    const entry = blob.store.get(pathname);
    if (!entry) return null;
    return {
      statusCode: 200,
      stream: new Response(entry.body).body,
      blob: { etag: String(entry.etag) },
    };
  },
  put: async (
    pathname: string,
    body: string,
    options: { allowOverwrite?: boolean; ifMatch?: string }
  ) => {
    const entry = blob.store.get(pathname);
    if (entry) {
      if (options.ifMatch !== undefined) {
        if (options.ifMatch !== String(entry.etag)) throw new blob.BlobPreconditionFailedError();
      } else if (!options.allowOverwrite) {
        throw new blob.BlobError("This blob already exists");
      }
    }
    blob.store.set(pathname, { body, etag: blob.next() });
    return { pathname };
  },
  del: async (pathname: string, options?: { ifMatch?: string }) => {
    const entry = blob.store.get(pathname);
    if (!entry) return;
    if (options?.ifMatch !== undefined && options.ifMatch !== String(entry.etag)) {
      throw new blob.BlobPreconditionFailedError();
    }
    blob.store.delete(pathname);
  },
}));

import {
  RESERVATION_TTL_MS,
  calculateDiscountCents,
  couponUnavailableMessage,
  findCoupon,
  isCouponExpired,
  getCouponAvailability,
  markCouponUsed,
  releaseCoupon,
  reserveCoupon,
} from "./coupons";

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

describe("findCoupon: SORELLAS10", () => {
  it("is 10% off, multi-use, and expires at the end of 15/11/2026 (Campo Grande time)", () => {
    const coupon = findCoupon("sorellas10");
    expect(coupon?.code).toBe("SORELLAS10");
    expect(coupon?.percentOff).toBe(10);
    expect(coupon?.singleUse).toBe(false);
    expect(coupon?.expiresAt).toBe("2026-11-15T23:59:59.999-04:00");
  });

  it("ATELIE10 stays single-use and never expires", () => {
    const coupon = findCoupon("ATELIE10");
    expect(coupon?.singleUse).toBe(true);
    expect(coupon?.expiresAt).toBeUndefined();
    expect(isCouponExpired(coupon!, Date.parse("2099-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("calculateDiscountCents", () => {
  it("rounds to the nearest cent", () => {
    expect(calculateDiscountCents(18000, 10)).toBe(1800);
    expect(calculateDiscountCents(21000, 10)).toBe(2100);
    expect(calculateDiscountCents(9999, 10)).toBe(1000);
  });
});

describe("coupon single use (reservation + usage)", () => {
  const CODE = "ATELIE10";
  const T0 = Date.parse("2026-11-10T12:00:00Z");

  beforeEach(() => {
    blob.store.clear();
  });

  it("is available when nobody reserved or used it", async () => {
    expect(await getCouponAvailability(CODE, "A", T0)).toBe("available");
    expect(await reserveCoupon(CODE, "A", T0)).toEqual({ ok: true });
  });

  it("while reserved for one order, other orders can neither apply nor reserve it", async () => {
    await reserveCoupon(CODE, "A", T0);
    expect(await getCouponAvailability(CODE, "B", T0 + 1000)).toBe("reserved");
    expect(await reserveCoupon(CODE, "B", T0 + 1000)).toEqual({ ok: false, reason: "reserved" });
  });

  it("the order holding the reservation keeps it (and can renew it)", async () => {
    await reserveCoupon(CODE, "A", T0);
    expect(await getCouponAvailability(CODE, "A", T0 + 1000)).toBe("available");
    expect(await reserveCoupon(CODE, "A", T0 + 60_000)).toEqual({ ok: true });
    // a renovação estende o prazo: B ainda está bloqueado após o prazo original
    expect(await reserveCoupon(CODE, "B", T0 + RESERVATION_TTL_MS + 1000)).toEqual({
      ok: false,
      reason: "reserved",
    });
  });

  it("an abandoned reservation expires and another order can take the coupon", async () => {
    await reserveCoupon(CODE, "A", T0);
    const later = T0 + RESERVATION_TTL_MS + 1;
    expect(await getCouponAvailability(CODE, "B", later)).toBe("available");
    expect(await reserveCoupon(CODE, "B", later)).toEqual({ ok: true });
    // e agora é o A que está bloqueado
    expect(await reserveCoupon(CODE, "A", later + 1000)).toEqual({ ok: false, reason: "reserved" });
  });

  it("two orders reserving at the same time: exactly one wins", async () => {
    const results = await Promise.all([reserveCoupon(CODE, "A", T0), reserveCoupon(CODE, "B", T0)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("two orders taking over an expired reservation at the same time: exactly one wins", async () => {
    await reserveCoupon(CODE, "OLD", T0);
    const later = T0 + RESERVATION_TTL_MS + 1;
    const results = await Promise.all([reserveCoupon(CODE, "A", later), reserveCoupon(CODE, "B", later)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("releasing frees the coupon, but only for the order that holds it", async () => {
    await reserveCoupon(CODE, "A", T0);
    await releaseCoupon(CODE, "B");
    expect(await getCouponAvailability(CODE, "B", T0 + 1000)).toBe("reserved");
    await releaseCoupon(CODE, "A");
    expect(await getCouponAvailability(CODE, "B", T0 + 1000)).toBe("available");
  });

  it("once paid the coupon is used forever and the reservation is gone", async () => {
    await reserveCoupon(CODE, "A", T0);
    await markCouponUsed(CODE, "A");
    expect(blob.store.has("coupons/atelie10-reservation.json")).toBe(false);
    expect(await getCouponAvailability(CODE, "B", T0 + 10 * RESERVATION_TTL_MS)).toBe("used");
    expect(await reserveCoupon(CODE, "B", T0 + 10 * RESERVATION_TTL_MS)).toEqual({
      ok: false,
      reason: "used",
    });
  });

  it("a coupon used before the usage record existed in the old format still counts as used", async () => {
    // formato antigo (antes das reservas): só { orderId, usedAt }
    blob.store.set("coupons/atelie10-usage.json", {
      body: JSON.stringify({ orderId: "OLD", usedAt: "2026-11-01T00:00:00Z" }),
      etag: blob.next(),
    });
    expect(await getCouponAvailability(CODE, "A", T0)).toBe("used");
  });

  it("marking used is idempotent for the same order and keeps the first user if two orders paid", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await markCouponUsed(CODE, "A");
    await markCouponUsed(CODE, "A");
    expect(error).not.toHaveBeenCalled();

    await markCouponUsed(CODE, "B");
    expect(error).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(blob.store.get("coupons/atelie10-usage.json")!.body);
    expect(stored.orderId).toBe("A");
    error.mockRestore();
  });

  it("explains why the coupon is not available", () => {
    expect(couponUnavailableMessage("used")).toContain("já foi utilizado");
    expect(couponUnavailableMessage("reserved")).toContain("em uso em outro pedido");
  });
});

describe("SORELLAS10: unlimited use until the 15th", () => {
  const CODE = "SORELLAS10";
  const LAST_MOMENT = Date.parse("2026-11-15T23:59:59-04:00");
  const MIDNIGHT_AFTER = Date.parse("2026-11-16T00:00:00-04:00");

  beforeEach(() => {
    blob.store.clear();
  });

  it("is valid every day up to and including the 15th, until 23:59 in Campo Grande", async () => {
    expect(await getCouponAvailability(CODE, "A", Date.parse("2026-11-10T09:00:00-04:00"))).toBe("available");
    expect(await getCouponAvailability(CODE, "A", Date.parse("2026-11-15T00:00:00-04:00"))).toBe("available");
    expect(await getCouponAvailability(CODE, "A", LAST_MOMENT)).toBe("available");
  });

  it("expires at midnight of the 16th", async () => {
    expect(isCouponExpired(findCoupon(CODE)!, MIDNIGHT_AFTER)).toBe(true);
    expect(await getCouponAvailability(CODE, "A", MIDNIGHT_AFTER)).toBe("expired");
    expect(await reserveCoupon(CODE, "A", MIDNIGHT_AFTER)).toEqual({ ok: false, reason: "expired" });
  });

  it("anyone can use it as many times as they want: many orders at once, none blocked", async () => {
    const results = await Promise.all(
      ["A", "B", "C", "D"].map((order) => reserveCoupon(CODE, order, LAST_MOMENT - 60_000))
    );
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await getCouponAvailability(CODE, "E", LAST_MOMENT - 60_000)).toBe("available");
  });

  it("paying with it does not burn it for the next order", async () => {
    await markCouponUsed(CODE, "A");
    expect(await getCouponAvailability(CODE, "B", LAST_MOMENT - 60_000)).toBe("available");
    expect(await reserveCoupon(CODE, "B", LAST_MOMENT - 60_000)).toEqual({ ok: true });
  });

  it("never writes anything to storage (no reservation or usage records)", async () => {
    await reserveCoupon(CODE, "A", LAST_MOMENT - 60_000);
    await markCouponUsed(CODE, "A");
    await releaseCoupon(CODE, "A");
    expect(blob.store.size).toBe(0);
  });

  it("using it does not affect the single-use ATELIE10", async () => {
    await markCouponUsed(CODE, "A");
    expect(await getCouponAvailability("ATELIE10", "B", Date.parse("2026-11-12T12:00:00Z"))).toBe("available");
  });

  it("an unknown code is invalid everywhere", async () => {
    expect(await getCouponAvailability("NAOEXISTE", "A")).toBe("invalid");
    expect(await reserveCoupon("NAOEXISTE", "A")).toEqual({ ok: false, reason: "invalid" });
    expect(couponUnavailableMessage("invalid")).toBe("Cupom inválido.");
    expect(couponUnavailableMessage("expired")).toBe("Este cupom expirou.");
  });
});
