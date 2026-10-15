import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del cliente.").max(160),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => value.length === 0 || /^[+()\d\s-]{7,30}$/.test(value),
      "Revisa el número de teléfono.",
    ),
  notes: z.string().trim().max(1000, "Las notas son demasiado extensas."),
});

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("3")) {
    return `+57${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+${digits}`;
  }
  return null;
}
