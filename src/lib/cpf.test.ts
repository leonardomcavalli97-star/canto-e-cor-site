import { describe, expect, it } from "vitest";
import { formatCpf, isValidCpf } from "./cpf";

describe("formatCpf", () => {
  it("adds dots and a dash as digits are typed", () => {
    expect(formatCpf("11144477735")).toBe("111.444.777-35");
    expect(formatCpf("111444777")).toBe("111.444.777");
    expect(formatCpf("111")).toBe("111");
  });

  it("ignores non-digit characters and caps at 11 digits", () => {
    expect(formatCpf("111.444.777-35999")).toBe("111.444.777-35");
  });
});

describe("isValidCpf", () => {
  it("accepts a CPF with correct check digits, formatted or not", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
    expect(isValidCpf("11144477735")).toBe(true);
  });

  it("rejects wrong check digits, wrong length, and repeated-digit CPFs", () => {
    expect(isValidCpf("111.444.777-36")).toBe(false);
    expect(isValidCpf("111.444.777")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });
});
