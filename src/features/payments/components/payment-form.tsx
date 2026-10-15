"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createPaymentAction, type PaymentFormState } from "@/features/payments/actions";
import { formatCop } from "@/features/quotes/domain";

type DebtOption = { id: number; memberId: number; memberName: string; eventLabel: string; amountCop: number };
type PaymentMethodOption = { id: number; name: string };
const initialState: PaymentFormState = { status: "idle", message: "" };

export function PaymentForm({ debts, paymentMethods, today }: { debts: DebtOption[]; paymentMethods: PaymentMethodOption[]; today: string }) {
  const [memberId, setMemberId] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [state, formAction, pending] = useActionState(createPaymentAction, initialState);
  const members = useMemo(() => [...new Map(debts.map((debt) => [debt.memberId, debt.memberName])).entries()], [debts]);
  const memberDebts = debts.filter((debt) => String(debt.memberId) === memberId);
  const total = debts.filter((debt) => selected.includes(debt.id)).reduce((sum, debt) => sum + debt.amountCop, 0);
  function chooseMember(value: string) { setMemberId(value); setSelected([]); }
  return (
    <form action={formAction} className="quote-form">
      <section className="form-panel">
        <div className="form-section-heading"><span className="eyebrow">Pago agrupado</span><h2>Registrar pago</h2><p>Selecciona las presentaciones que vas a pagar en una sola operación.</p></div>
        <div className="form-grid form-grid--two">
          <label className="field-group field-group--wide"><span className="field-label">Músico *</span><select className="text-field" name="memberId" onChange={(event) => chooseMember(event.target.value)} required value={memberId}><option value="">Selecciona un músico</option>{members.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <div className="field-group field-group--wide"><span className="field-label">Deudas a pagar *</span>{memberId && !memberDebts.length ? <p>No hay deudas pendientes.</p> : memberDebts.map((debt) => <label className="checkbox-row" key={debt.id}><input checked={selected.includes(debt.id)} name="obligationIds" onChange={(event) => setSelected((current) => event.target.checked ? [...current, debt.id] : current.filter((id) => id !== debt.id))} type="checkbox" value={debt.id} /><span><strong>{debt.eventLabel}</strong><small>{formatCop(debt.amountCop)}</small></span></label>)}</div>
          <label className="field-group"><span className="field-label">Fecha de pago *</span><input className="text-field" defaultValue={today} name="paidOn" required type="date" /></label>
          <label className="field-group"><span className="field-label">Medio de pago *</span><select className="text-field" defaultValue="" name="paymentMethodId" required><option value="">Selecciona un medio</option>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
          <label className="field-group"><span className="field-label">Referencia</span><input className="text-field" maxLength={180} name="reference" /></label>
          <label className="field-group"><span className="field-label">Notas</span><input className="text-field" maxLength={1000} name="notes" /></label>
        </div>
        <p><strong>Total del pago: {formatCop(total)}</strong></p>
      </section>
      {state.message ? <p className="action-message action-message--error">{state.message}</p> : null}
      <div className="sticky-form-actions"><Link className="secondary-button" href="/pagos">Cancelar</Link><button className="primary-button" disabled={pending || selected.length === 0} type="submit">{pending ? "Guardando…" : `Registrar pago de ${formatCop(total)}`}</button></div>
    </form>
  );
}
