"use server";

import { revalidatePath } from "next/cache";

import { clientSchema, normalizePhone } from "@/domain/clients";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type ClientFormState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: Partial<Record<"name" | "phone" | "notes", string[]>>;
};

export async function createClientAction(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos señalados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const normalizedPhone = normalizePhone(parsed.data.phone);

    if (parsed.data.phone && !normalizedPhone) {
      return {
        status: "error",
        message: "Revisa el teléfono e incluye el indicativo si no es colombiano.",
        errors: { phone: ["No se pudo reconocer este número."] },
      };
    }

    const { error } = await supabase.from("clients").insert({
      band_id: owner.bandId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      normalized_phone: normalizedPhone,
      notes: parsed.data.notes || null,
    });

    if (error) throw error;
    revalidatePath("/clientes");
    return { status: "success", message: "Cliente guardado correctamente." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible guardar el cliente.",
    };
  }
}

export async function toggleClientArchiveAction(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  if (!Number.isSafeInteger(clientId) || clientId <= 0) return;

  const owner = await requireOwnerContext();
  const supabase = await createClient();
  const { data: client, error: readError } = await supabase
    .from("clients")
    .select("archived_at")
    .eq("id", clientId)
    .eq("band_id", owner.bandId)
    .single();

  if (readError) throw readError;
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: client.archived_at ? null : new Date().toISOString() })
    .eq("id", clientId)
    .eq("band_id", owner.bandId);

  if (error) throw error;
  revalidatePath("/clientes");
}
