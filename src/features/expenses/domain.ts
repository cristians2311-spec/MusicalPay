import { z } from "zod";

export const eventExpenseSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  description: z.string().trim().min(2).max(240),
  payeeName: z.string().trim().min(2).max(160),
  amountCop: z.coerce.number().int().min(0).max(9_000_000_000),
  expenseDate: z.iso.date(),
  notes: z.string().trim().max(1000),
});
