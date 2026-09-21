import { describe, expect, it } from "vitest";
import { buildCheckoutItems } from "./infinitepay";
import type { OrderRecord } from "./orders";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    createdAt: "2026-09-20T00:00:00.000Z",
    status: "pix_pending",
    name: "Cliente",
    email: "cliente@example.com",
    phone: "67999999999",
    items: [
      {
        paperSize: "A4",
        theme: "casal",
        description: "x",
        referenceFiles: [],
        quantity: 2,
        unitPriceCents: 21000,
      },
    ],
    shippingAddress: {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
    shippingCents: 2500,
    totalPriceCents: 21000 * 2 + 2500 + 3000 * 2,
    rushDays: 20,
    rushCents: 3000 * 2,
    ...overrides,
  };
}

describe("buildCheckoutItems", () => {
  it("splits the order into items, rush fee and shipping that sum to the total", () => {
    const order = makeOrder();
    const items = buildCheckoutItems(order);
    expect(items).toHaveLength(3);
    expect(items.reduce((s, i) => s + i.price * i.quantity, 0)).toBe(order.totalPriceCents);
  });

  it("omits shipping and rush lines when they are free", () => {
    const order = makeOrder({ shippingCents: 0, rushCents: 0, rushDays: null, totalPriceCents: 42000 });
    expect(buildCheckoutItems(order)).toHaveLength(1);
  });

  it("falls back to a single item if the lines do not add up to the stored total", () => {
    const order = makeOrder({ totalPriceCents: 99999 });
    expect(buildCheckoutItems(order)).toEqual([
      { quantity: 1, price: 99999, description: "Aquarela personalizada - Canto e Cor" },
    ]);
  });
});
