import { describe, expect, it } from "vitest";

import { memberSchema } from "./domain";

const validMember = {
  name: "  Carlos Martínez  ",
  nickname: "  Carlitos  ",
  phone: "300 123 4567",
  notes: "  Disponible los fines de semana.  ",
  roleIds: [2, 4],
};

describe("memberSchema", () => {
  it("normaliza los textos y conserva varios roles", () => {
    const result = memberSchema.parse(validMember);

    expect(result).toEqual({
      name: "Carlos Martínez",
      nickname: "Carlitos",
      phone: "300 123 4567",
      notes: "Disponible los fines de semana.",
      roleIds: [2, 4],
    });
  });

  it("exige al menos un rol válido", () => {
    const result = memberSchema.safeParse({ ...validMember, roleIds: [] });

    expect(result.success).toBe(false);
  });

  it("rechaza roles repetidos y teléfonos con letras", () => {
    const result = memberSchema.safeParse({
      ...validMember,
      phone: "llamar después",
      roleIds: [2, 2],
    });

    expect(result.success).toBe(false);
  });
});
