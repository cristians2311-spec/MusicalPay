"use server";

import { revalidatePath } from "next/cache";

import { eventExpenseSchema } from "@/features/expenses/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type ExpenseFormState = { status: "idle" | "error" | "success"; message: string };

export async function createEventExpenseAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsed = eventExpenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa los datos del gasto." };
  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const [{ data: event }, { data: category }] = await Promise.all([
      supabase.from("events").select("id").eq("id", parsed.data.eventId).eq("band_id", owner.bandId).maybeSingle(),
      supabase.from("expense_categories").select("id").eq("id", parsed.data.categoryId).eq("band_id", owner.bandId).eq("is_active", true).maybeSingle(),
    ]);
    if (!event || !category) return { status: "error", message: "El evento o la categoría ya no está disponible." };
    const { error } = await supabase.from("event_expenses").insert({
      actual_amount_cop: parsed.data.amountCop,
      band_id: owner.bandId,
      category_id: parsed.data.categoryId,
      description: parsed.data.description,
      event_id: parsed.data.eventId,
      expense_date: parsed.data.expenseDate,
      notes: parsed.data.notes || null,
      payee_name: parsed.data.payeeName,
    });
    if (error) throw error;
    revalidatePath(`/eventos/${parsed.data.eventId}`);
    revalidatePath("/inicio");
    return { status: "success", message: "Gasto registrado correctamente." };
  } catch {
    return { status: "error", message: "No fue posible registrar el gasto." };
  }
}
