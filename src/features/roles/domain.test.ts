import { describe, expect, it } from "vitest";

import { roleSchema } from "./domain";

describe("roleSchema", () => {
  it("limpia el nombre del rol", () => {
    expect(roleSchema.parse({ name: "  Segunda voz  " })).toEqual({ name: "Segunda voz" });
  });

  it("rechaza nombres vacíos o demasiado extensos", () => {
    expect(roleSchema.safeParse({ name: " " }).success).toBe(false);
    expect(roleSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
  });
});
