"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { eventSchema } from "@/features/events/domain";
import { toBogotaTimestamp } from "@/features/quotes/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { status: "idle" | "error"; message: string };

export async function createEventAction(
  _previousState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa los datos del evento." };

  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", parsed.data.clientId)
      .eq("band_id", owner.bandId)
      .is("archived_at", null)
      .single();
    if (clientError || !client) return { status: "error", message: "El cliente no está disponible." };

    const { data: eventNumber, error: numberError } = await supabase.rpc("next_document_number", { requested_type: "event" });
    if (numberError) throw numberError;
    const { error } = await supabase.from("events").insert({
      address: parsed.data.address || null,
      agreed_price_cop: parsed.data.agreedPriceCop,
      band_id: owner.bandId,
      break_minutes: parsed.data.breakMinutes,
      client_id: parsed.data.clientId,
      event_date: parsed.data.eventDate,
      event_number: Number(eventNumber),
      half_tanda_units: parsed.data.halfTandaUnits,
      internal_notes: parsed.data.internalNotes || null,
      occasion: parsed.data.occasion,
      starts_at: parsed.data.startTime ? toBogotaTimestamp(parsed.data.eventDate, parsed.data.startTime) : null,
      venue: parsed.data.venue,
    });
    if (error) throw error;
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No fue posible crear el evento." };
  }

  revalidatePath("/eventos");
  redirect("/eventos?creado=1");
}
