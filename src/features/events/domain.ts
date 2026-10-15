import { z } from "zod";

export const eventSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  occasion: z.string().trim().min(2).max(160),
  agreedPriceCop: z.coerce.number().int().min(0).max(9_000_000_000),
  eventDate: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")),
  durationTandas: z.coerce.number().min(0.5).max(24).refine((value) => Number.isInteger(value * 2)),
  breakMinutes: z.coerce.number().int().min(0).max(1440),
  venue: z.string().trim().min(2).max(180),
  address: z.string().trim().max(240),
  internalNotes: z.string().trim().max(3000),
}).transform(({ durationTandas, ...event }) => ({
  ...event,
  halfTandaUnits: Math.round(durationTandas * 2),
}));
