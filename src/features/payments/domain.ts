import { z } from "zod";

export const paymentSchema = z.object({
  memberId: z.coerce.number().int().positive(),
  obligationIds: z.array(z.coerce.number().int().positive()).min(1),
  paidOn: z.iso.date(),
  paymentMethodId: z.coerce.number().int().positive(),
  reference: z.string().trim().max(180),
  notes: z.string().trim().max(1000),
});

export function remainingObligation(recognizedAmountCop: number, allocatedAmountCop: number) {
  return Math.max(recognizedAmountCop - allocatedAmountCop, 0);
}
