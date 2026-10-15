import { z } from "zod";

export const collectionSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  amountCop: z.coerce.number().int().positive().max(9_000_000_000),
  receivedOn: z.iso.date(),
  paymentMethodId: z.coerce.number().int().positive(),
  reference: z.string().trim().max(180),
  notes: z.string().trim().max(1000),
});

export function calculateEventBalance(agreedPriceCop: number, collectedCop: number) {
  return Math.max(agreedPriceCop - collectedCop, 0);
}
