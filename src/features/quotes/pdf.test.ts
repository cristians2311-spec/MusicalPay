import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { generateQuotePdf } from "./pdf";

describe("generateQuotePdf", () => {
  it("genera un archivo PDF descargable", async () => {
    const bytes = await generateQuotePdf({ quoteNumber: 1, clientName: "Jorge", clientPhone: "3138132394", occasion: "Cumpleaños", eventDate: "2026-10-16", startsAt: "2026-10-17T01:12:00.000Z", venue: "Cocodisk", address: null, expiresOn: "2026-10-22", generalConditions: null, options: [{ optionNumber: 1, name: "Opción principal", priceCop: 1_000_000, halfTandaUnits: 2, breakMinutes: 15, requiredAdvanceCop: null, customerConditions: null }] });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1_000);
  });

  it("mantiene hasta cinco opciones resumidas en una sola página", async () => {
    const bytes = await generateQuotePdf({ quoteNumber: 2, clientName: "Jorge", clientPhone: "3138132394", occasion: "Cumpleaños", eventDate: "2026-10-16", startsAt: "2026-10-17T01:12:00.000Z", venue: "Cocodisk", address: null, expiresOn: "2026-10-22", generalConditions: null, options: Array.from({ length: 5 }, (_, index) => ({ optionNumber: index + 1, name: `Alternativa ${index + 1}`, priceCop: 1_000_000 + index * 100_000, halfTandaUnits: 2, breakMinutes: 15, requiredAdvanceCop: null, customerConditions: null })) });
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
  });
});
