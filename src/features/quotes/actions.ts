"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  quoteDraftSchema,
  toBogotaTimestamp,
  toDatabaseQuoteOptions,
} from "@/features/quotes/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type QuoteFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createQuoteDraftAction(
  _previousState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const rawOptions = formData.get("options");
  let options: unknown = [];

  if (typeof rawOptions === "string" && rawOptions.length <= 20_000) {
    try {
      options = JSON.parse(rawOptions);
    } catch {
      return { status: "error", message: "No se pudieron leer las opciones de la cotización." };
    }
  }

  const parsed = quoteDraftSchema.safeParse({
    clientId: formData.get("clientId"),
    eventDate: formData.get("eventDate"),
    startTime: formData.get("startTime"),
    venue: formData.get("venue"),
    address: formData.get("address"),
    occasion: formData.get("occasion"),
    validityDays: formData.get("validityDays"),
    generalConditions: formData.get("generalConditions"),
    internalNotes: formData.get("internalNotes"),
    options,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos de la cotización y sus opciones.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireOwnerContext();
    const supabase = await createClient();
    const { error } = await supabase.rpc("create_quote_draft", {
      p_client_id: parsed.data.clientId,
      p_event_date: parsed.data.eventDate,
      p_starts_at: toBogotaTimestamp(parsed.data.eventDate, parsed.data.startTime),
      p_venue: parsed.data.venue,
      p_address: parsed.data.address,
      p_occasion: parsed.data.occasion,
      p_validity_days: parsed.data.validityDays,
      p_general_conditions: parsed.data.generalConditions,
      p_internal_notes: parsed.data.internalNotes,
      p_options: toDatabaseQuoteOptions(parsed.data.options),
    });

    if (error) throw error;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible guardar la cotización.",
    };
  }

  revalidatePath("/cotizaciones");
  redirect("/cotizaciones?creada=1");
}
