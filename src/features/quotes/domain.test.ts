import { describe, expect, it } from "vitest";

import { formatCop, quoteDraftSchema, toBogotaTimestamp, toDatabaseQuoteOptions } from "./domain";

const validDraft = {
  clientId: "1",
  eventDate: "2026-10-17",
  startTime: "22:30",
  venue: "Casa Campestre",
  address: "Vía Valledupar",
  occasion: "Cumpleaños",
  validityDays: "7",
  generalConditions: "",
  internalNotes: "",
  options: [{
    name: "Formato habitual",
    priceCop: "1200000",
    durationTandas: "1.5",
    breakMinutes: "15",
    requiredAdvanceCop: "300000",
    customerConditions: "",
  }],
};

describe("cotizaciones", () => {
  it("acepta COP enteros y medias tandas", () => {
    const result = quoteDraftSchema.parse(validDraft);
    expect(result.options[0].durationTandas).toBe(1.5);
    expect(toDatabaseQuoteOptions(result.options)[0].half_tanda_units).toBe(3);
  });

  it("rechaza centavos y cuartos de tanda", () => {
    const result = quoteDraftSchema.safeParse({
      ...validDraft,
      options: [{ ...validDraft.options[0], priceCop: "1200000.5", durationTandas: "1.25" }],
    });
    expect(result.success).toBe(false);
  });

  it("convierte la hora de Colombia a un instante inequívoco", () => {
    expect(toBogotaTimestamp("2026-10-17", "22:30")).toBe("2026-10-18T03:30:00.000Z");
    expect(toBogotaTimestamp("2026-10-17", "")).toBeNull();
  });

  it("formatea pesos sin centavos", () => {
    expect(formatCop(1200000)).toContain("1.200.000");
  });
});
