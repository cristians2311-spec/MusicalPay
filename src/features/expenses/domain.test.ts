import { describe, expect, it } from "vitest";

import { eventExpenseSchema } from "./domain";

describe("eventExpenseSchema", () => {
  const expense = { eventId: "1", categoryId: "2", description: "Transporte", payeeName: "Conductor", amountCop: "120000", expenseDate: "2026-10-15", notes: "" };
  it("convierte el valor pagado a entero", () => {
    expect(eventExpenseSchema.parse(expense).amountCop).toBe(120_000);
  });
  it("rechaza descripciones incompletas", () => {
    expect(eventExpenseSchema.safeParse({ ...expense, description: "x" }).success).toBe(false);
  });
});
