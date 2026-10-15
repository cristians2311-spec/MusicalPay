import { z } from "zod";

const quoteOptionSchema = z.object({
  name: z.string().trim().min(2, "Nombra esta opción.").max(120),
  priceCop: z.coerce.number().int().min(0).max(999_999_999),
  durationTandas: z.coerce.number().min(0.5).max(12).multipleOf(0.5),
  breakMinutes: z.coerce.number().int().min(0).max(360),
  requiredAdvanceCop: z.union([
    z.literal(""),
    z.coerce.number().int().min(0).max(999_999_999),
  ]),
  customerConditions: z.string().trim().max(1000),
});

export const quoteDraftSchema = z.object({
  clientId: z.coerce.number().int().positive("Selecciona un cliente."),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha."),
  startTime: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]),
  venue: z.string().trim().min(2, "Escribe el lugar.").max(180),
  address: z.string().trim().max(240),
  occasion: z.string().trim().min(2, "Escribe el tipo de evento.").max(160),
  validityDays: z.coerce.number().int().min(1).max(90),
  generalConditions: z.string().trim().max(3000),
  internalNotes: z.string().trim().max(3000),
  options: z.array(quoteOptionSchema).min(1).max(5),
});

export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

export function toBogotaTimestamp(eventDate: string, startTime: string) {
  if (!startTime) return null;
  return new Date(`${eventDate}T${startTime}:00-05:00`).toISOString();
}

export function formatCop(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toDatabaseQuoteOptions(options: QuoteDraft["options"]) {
  return options.map((option) => ({
    name: option.name,
    price_cop: option.priceCop,
    half_tanda_units: option.durationTandas * 2,
    break_minutes: option.breakMinutes,
    required_advance_cop:
      option.requiredAdvanceCop === "" ? "" : option.requiredAdvanceCop,
    customer_conditions: option.customerConditions,
  }));
}
