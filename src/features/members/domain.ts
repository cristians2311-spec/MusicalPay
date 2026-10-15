import { z } from "zod";

const optionalText = (maximum: number, message: string) =>
  z.string().trim().max(maximum, message);

export const memberSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del músico.").max(160),
  nickname: optionalText(160, "El apodo es demasiado extenso."),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => value.length === 0 || /^[+()\d\s-]{7,30}$/.test(value),
      "Revisa el número de teléfono.",
    ),
  notes: optionalText(1000, "Las notas son demasiado extensas."),
  roleIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Selecciona al menos un rol.")
    .max(12, "Seleccionaste demasiados roles.")
    .refine(
      (roleIds) => new Set(roleIds).size === roleIds.length,
      "No repitas un rol.",
    ),
});
