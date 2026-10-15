import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del rol.").max(80, "El nombre es demasiado extenso."),
});
