"use client";

import { useActionState } from "react";

import { createEventExpenseAction, type ExpenseFormState } from "@/features/expenses/actions";

type CategoryOption = { id: number; name: string };
const initialState: ExpenseFormState = { status: "idle", message: "" };

export function ExpenseForm({ eventId, categories, defaultDate }: { eventId: number; categories: CategoryOption[]; defaultDate: string }) {
  const [state, formAction, pending] = useActionState(createEventExpenseAction, initialState);
  return (
    <form action={formAction} className="form-grid form-grid--two">
      <input name="eventId" type="hidden" value={eventId} />
      <label className="field-group"><span className="field-label">Categoría *</span><select className="text-field" defaultValue="" name="categoryId" required><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="field-group"><span className="field-label">Concepto *</span><input className="text-field" maxLength={240} name="description" required /></label>
      <label className="field-group"><span className="field-label">Pagado a *</span><input className="text-field" maxLength={160} name="payeeName" required /></label>
      <label className="field-group"><span className="field-label">Valor pagado *</span><input className="text-field" inputMode="numeric" min="0" name="amountCop" required step="1" type="number" /></label>
      <label className="field-group"><span className="field-label">Fecha *</span><input className="text-field" defaultValue={defaultDate} name="expenseDate" required type="date" /></label>
      <label className="field-group"><span className="field-label">Notas</span><input className="text-field" maxLength={1000} name="notes" /></label>
      {state.message ? <p className={`action-message ${state.status === "success" ? "action-message--success" : "action-message--error"}`}>{state.message}</p> : null}
      <div><button className="primary-button" disabled={pending || categories.length === 0} type="submit">{pending ? "Guardando…" : "Registrar gasto"}</button></div>
    </form>
  );
}
