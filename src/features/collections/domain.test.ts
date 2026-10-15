import { describe, expect, it } from "vitest";

import { calculateEventBalance, collectionSchema } from "./domain";

const validCollection = {
  eventId: "2",
  amountCop: "250000",
  receivedOn: "2026-10-15",
  paymentMethodId: "1",
  reference: "Nequi 123",
  notes: "Anticipo",
};

describe("collectionSchema", () => {
  it("convierte los identificadores y el valor a números", () => {
    const collection = collectionSchema.parse(validCollection);
    expect(collection.eventId).toBe(2);
    expect(collection.amountCop).toBe(250_000);
  });

  it("rechaza cobros sin valor positivo", () => {
    expect(collectionSchema.safeParse({ ...validCollection, amountCop: "0" }).success).toBe(false);
  });
});

describe("calculateEventBalance", () => {
  it("calcula el saldo sin producir valores negativos", () => {
    expect(calculateEventBalance(1_000_000, 350_000)).toBe(650_000);
    expect(calculateEventBalance(1_000_000, 1_200_000)).toBe(0);
  });
});
