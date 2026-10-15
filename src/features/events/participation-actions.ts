"use server";

import { revalidatePath } from "next/cache";

import { eventParticipationSchema } from "@/features/events/participation-domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type ParticipationFormState = { status: "idle" | "error" | "success"; message: string };

export async function addEventParticipationAction(
  _previousState: ParticipationFormState,
  formData: FormData,
): Promise<ParticipationFormState> {
  const parsed = eventParticipationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa el músico, el rol y el valor." };
  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const [{ data: event }, { data: memberRole }] = await Promise.all([
      supabase.from("events").select("id,operational_status").eq("id", parsed.data.eventId).eq("band_id", owner.bandId).maybeSingle(),
      supabase.from("member_roles").select("member_id,role_id").eq("band_id", owner.bandId).eq("member_id", parsed.data.memberId).eq("role_id", parsed.data.roleId).maybeSingle(),
    ]);
    if (!event || event.operational_status === "cancelled" || event.operational_status === "performed") return { status: "error", message: "Este evento ya no admite cambios de músicos." };
    if (!memberRole) return { status: "error", message: "El músico no tiene asignado ese rol." };
    const { data: participation, error } = await supabase.from("event_participations").insert({
      agreed_fee_cop: parsed.data.agreedFeeCop,
      band_id: owner.bandId,
      event_id: parsed.data.eventId,
      member_id: parsed.data.memberId,
      notes: parsed.data.notes || null,
    }).select("id").single();
    if (error) throw error;
    const { error: roleError } = await supabase.from("event_participation_roles").insert({ band_id: owner.bandId, participation_id: participation.id, role_id: parsed.data.roleId });
    if (roleError) {
      await supabase.from("event_participations").delete().eq("id", participation.id).eq("band_id", owner.bandId);
      throw roleError;
    }
    revalidatePath(`/eventos/${parsed.data.eventId}`);
    return { status: "success", message: "Músico agregado al evento." };
  } catch (error) {
    const message = error instanceof Error && error.message.includes("duplicate") ? "Este músico ya está asignado al evento." : error instanceof Error ? error.message : "No fue posible agregar el músico.";
    return { status: "error", message };
  }
}

export async function markEventPerformedAction(formData: FormData) {
  const eventId = Number(formData.get("eventId"));
  if (!Number.isSafeInteger(eventId) || eventId <= 0) return;
  const owner = await requireOwnerContext();
  const supabase = await createClient();
  if (!owner.bandId) return;
  const { error } = await supabase.rpc("finish_event", { requested_event_id: eventId });
  if (error) throw new Error("No fue posible marcar el evento como realizado.");
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/eventos");
  revalidatePath("/pagos");
}

export async function cancelEventAction(formData: FormData) {
  const eventId = Number(formData.get("eventId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isSafeInteger(eventId) || eventId <= 0 || reason.length < 3 || reason.length > 500) return;
  await requireOwnerContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event", { requested_event_id: eventId, requested_reason: reason });
  if (error) throw new Error("No fue posible cancelar el evento.");
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/eventos");
  revalidatePath("/cobros");
  revalidatePath("/inicio");
}
