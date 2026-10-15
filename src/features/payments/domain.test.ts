import { describe, expect, it } from "vitest";

import { paymentSchema, remainingObligation } from "./domain";

describe("paymentSchema", () => {
  it("requiere por lo menos una obligación", () => {
    const base = { memberId: "2", obligationIds: ["3"], paidOn: "2026-10-15", paymentMethodId: "1", reference: "", notes: "" };
    expect(paymentSchema.parse(base).obligationIds).toEqual([3]);
    expect(paymentSchema.safeParse({ ...base, obligationIds: [] }).success).toBe(false);
  });
});

describe("remainingObligation", () => {
  it("calcula lo pendiente de una obligación", () => {
    expect(remainingObligation(100_000, 40_000)).toBe(60_000);
    expect(remainingObligation(100_000, 120_000)).toBe(0);
  });
});
