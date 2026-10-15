"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paymentSchema } from "@/features/payments/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type PaymentFormState = { status: "idle" | "error"; message: string };

export async function createPaymentAction(
  _previousState: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const parsed = paymentSchema.safeParse({
    memberId: formData.get("memberId"),
    obligationIds: formData.getAll("obligationIds"),
    paidOn: formData.get("paidOn"),
    paymentMethodId: formData.get("paymentMethodId"),
    reference: formData.get("reference"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { status: "error", message: "Selecciona el músico, las deudas y el medio de pago." };
  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    if (!owner.bandId) return { status: "error", message: "No se encontró la agrupación." };
    const { error } = await supabase.rpc("register_member_payment", {
      requested_idempotency_key: crypto.randomUUID(),
      requested_member_id: parsed.data.memberId,
      requested_notes: parsed.data.notes,
      requested_obligation_ids: [...new Set(parsed.data.obligationIds)],
      requested_paid_on: parsed.data.paidOn,
      requested_payment_method_id: parsed.data.paymentMethodId,
      requested_reference: parsed.data.reference,
    });
    if (error) throw error;
  } catch {
    return { status: "error", message: "No fue posible registrar el pago. Actualiza la página e inténtalo de nuevo." };
  }
  revalidatePath("/pagos");
  revalidatePath("/inicio");
  redirect("/pagos?creado=1");
}
