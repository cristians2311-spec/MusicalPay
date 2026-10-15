import { describe, expect, it } from "vitest";

import { eventSchema } from "./domain";

const validEvent = {
  clientId: "1",
  occasion: "Cumpleaños",
  agreedPriceCop: "1200000",
  eventDate: "2026-10-20",
  startTime: "20:30",
  durationTandas: "1.5",
  breakMinutes: "15",
  venue: "Salón principal",
  address: "Calle 10",
  internalNotes: "Cliente frecuente",
};

describe("eventSchema", () => {
  it("convierte valores de formulario a unidades seguras", () => {
    const event = eventSchema.parse(validEvent);
    expect(event.agreedPriceCop).toBe(1_200_000);
    expect(event.halfTandaUnits).toBe(3);
  });

  it("rechaza precios negativos y fracciones distintas de media tanda", () => {
    expect(eventSchema.safeParse({ ...validEvent, agreedPriceCop: "-1" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...validEvent, durationTandas: "1.25" }).success).toBe(false);
  });
});
