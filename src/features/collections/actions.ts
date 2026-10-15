"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { collectionSchema } from "@/features/collections/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type CollectionFormState = { status: "idle" | "error"; message: string };

export async function createCollectionAction(
  _previousState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa los datos del cobro." };

  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const [{ data: event }, { data: method }] = await Promise.all([
      supabase.from("events").select("id").eq("id", parsed.data.eventId).eq("band_id", owner.bandId).neq("operational_status", "cancelled").maybeSingle(),
      supabase.from("payment_methods").select("id").eq("id", parsed.data.paymentMethodId).eq("band_id", owner.bandId).eq("is_active", true).maybeSingle(),
    ]);
    if (!event) return { status: "error", message: "El evento no está disponible." };
    if (!method) return { status: "error", message: "El medio de pago no está disponible." };

    const { data: collectionNumber, error: numberError } = await supabase.rpc("next_document_number", { requested_type: "collection" });
    if (numberError) throw numberError;
    const { error } = await supabase.from("collections").insert({
      amount_cop: parsed.data.amountCop,
      band_id: owner.bandId,
      collection_number: Number(collectionNumber),
      event_id: parsed.data.eventId,
      idempotency_key: crypto.randomUUID(),
      notes: parsed.data.notes || null,
      payment_method_id: parsed.data.paymentMethodId,
      received_on: parsed.data.receivedOn,
      reference: parsed.data.reference || null,
    });
    if (error) throw error;
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No fue posible registrar el cobro." };
  }

  revalidatePath("/cobros");
  revalidatePath("/inicio");
  redirect("/cobros?creado=1");
}
