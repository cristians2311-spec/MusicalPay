import { z } from "zod";

export const eventParticipationSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
  roleId: z.coerce.number().int().positive(),
  agreedFeeCop: z.coerce.number().int().min(0).max(9_000_000_000),
  notes: z.string().trim().max(1000),
});
