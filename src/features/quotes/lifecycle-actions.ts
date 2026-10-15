"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export async function issueQuoteAction(formData: FormData) {
  const quoteId = Number(formData.get("quoteId"));
  if (!Number.isSafeInteger(quoteId) || quoteId <= 0) return;
  await requireOwnerContext();
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_quote", { requested_quote_id: quoteId });
  if (error) throw new Error("No fue posible emitir la cotización.");
  revalidatePath(`/cotizaciones/${quoteId}`);
  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${quoteId}?emitida=1`);
}

export async function acceptQuoteOptionAction(formData: FormData) {
  const quoteId = Number(formData.get("quoteId"));
  const optionId = Number(formData.get("optionId"));
  if (!Number.isSafeInteger(quoteId) || quoteId <= 0 || !Number.isSafeInteger(optionId) || optionId <= 0) return;
  await requireOwnerContext();
  const supabase = await createClient();
  const { data: eventId, error } = await supabase.rpc("accept_quote_option", {
    requested_advance_waived: formData.get("advanceWaived") === "on",
    requested_option_id: optionId,
    requested_quote_id: quoteId,
  });
  if (error || !eventId) throw new Error("No fue posible aceptar esta opción.");
  revalidatePath("/cotizaciones");
  revalidatePath("/eventos");
  redirect(`/eventos/${eventId}`);
}
