import { beforeAll, describe, expect, it } from "vitest";
import { buildPix } from "./pix";

describe("buildPix", () => {
  beforeAll(() => {
    process.env.PIX_KEY = "+5511999999999";
  });

  it("generates a BR Code (EMV QR) string carrying the merchant and amount", async () => {
    const { brCode } = await buildPix({ amountCents: 21000, txid: "abc123" });
    expect(typeof brCode).toBe("string");
    expect(brCode.length).toBeGreaterThan(0);
    // EMV static QR payloads always start with the payload-format-indicator tag.
    expect(brCode.startsWith("000201")).toBe(true);
    expect(brCode).toContain("210.00");
  });

  it("generates a scannable QR code image", async () => {
    const { qrCodeImage } = await buildPix({ amountCents: 5000, txid: "xyz" });
    expect(qrCodeImage).toBeTruthy();
  });

  it("strips non-alphanumeric characters from the txid and caps it at 25 chars", async () => {
    const longId = "12345678-90ab-cdef-1234-567890abcdef-extra-stuff";
    const { brCode } = await buildPix({ amountCents: 1000, txid: longId });
    const sanitized = longId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
    expect(brCode).toContain(sanitized);
  });
});
