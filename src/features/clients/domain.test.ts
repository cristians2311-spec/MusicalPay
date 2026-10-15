import { describe, expect, it } from "vitest";

import { clientSchema, normalizePhone } from "./domain";

describe("normalizePhone", () => {
  it("convierte un celular colombiano al formato internacional", () => {
    expect(normalizePhone("300 123 4567")).toBe("+573001234567");
  });

  it("conserva un número internacional válido", () => {
    expect(normalizePhone("+1 (305) 555-0199")).toBe("+13055550199");
  });

  it("devuelve null cuando no puede normalizarlo de forma segura", () => {
    expect(normalizePhone("605 1234")).toBeNull();
  });
});

describe("clientSchema", () => {
  it("rechaza nombres vacíos y teléfonos con letras", () => {
    const result = clientSchema.safeParse({ name: " ", phone: "llámame", notes: "" });
    expect(result.success).toBe(false);
  });
});
