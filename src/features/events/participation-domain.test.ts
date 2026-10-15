import { describe, expect, it } from "vitest";

import { eventParticipationSchema } from "./participation-domain";

describe("eventParticipationSchema", () => {
  it("acepta un músico, su rol y el pago acordado", () => {
    const result = eventParticipationSchema.parse({ eventId: "1", memberId: "2", roleId: "3", agreedFeeCop: "80000", notes: "" });
    expect(result.agreedFeeCop).toBe(80_000);
  });

  it("rechaza pagos negativos", () => {
    expect(eventParticipationSchema.safeParse({ eventId: "1", memberId: "2", roleId: "3", agreedFeeCop: "-1", notes: "" }).success).toBe(false);
  });
});
