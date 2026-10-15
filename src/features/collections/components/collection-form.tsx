"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createCollectionAction, type CollectionFormState } from "@/features/collections/actions";
import { formatCop } from "@/features/quotes/domain";

type EventOption = { id: number; event_number: number; occasion: string; agreed_price_cop: number; clientName: string };
type PaymentMethodOption = { id: number; name: string };
const initialState: CollectionFormState = { status: "idle", message: "" };

export function CollectionForm({ events, paymentMethods, today }: { events: EventOption[]; paymentMethods: PaymentMethodOption[]; today: string }) {
  const [state, formAction, pending] = useActionState(createCollectionAction, initialState);
  const unavailable = events.length === 0 || paymentMethods.length === 0;
  return (
    <form action={formAction} className="quote-form">
      <section className="form-panel">
        <div className="form-section-heading"><span className="eyebrow">Ingreso recibido</span><h2>Registrar cobro</h2><p>Relaciona cada anticipo o pago final con su evento.</p></div>
        <div className="form-grid form-grid--two">
          <label className="field-group field-group--wide"><span className="field-label">Evento *</span><select className="text-field" defaultValue="" name="eventId" required><option disabled value="">Selecciona un evento</option>{events.map((event) => <option key={event.id} value={event.id}>EV-{String(event.event_number).padStart(4, "0")} · {event.clientName} · {event.occasion} · {formatCop(event.agreed_price_cop)}</option>)}</select></label>
          <label className="field-group"><span className="field-label">Valor recibido *</span><input className="text-field" inputMode="numeric" min="1" name="amountCop" required step="1" type="number" /></label>
          <label className="field-group"><span className="field-label">Fecha de recepción *</span><input className="text-field" defaultValue={today} name="receivedOn" required type="date" /></label>
          <label className="field-group"><span className="field-label">Medio de pago *</span><select className="text-field" defaultValue="" name="paymentMethodId" required><option disabled value="">Selecciona un medio</option>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
          <label className="field-group"><span className="field-label">Referencia</span><input className="text-field" maxLength={180} name="reference" placeholder="Comprobante o número de operación" /></label>
          <label className="field-group field-group--wide"><span className="field-label">Notas</span><textarea className="text-field text-field--area" maxLength={1000} name="notes" rows={3} /></label>
        </div>
        {unavailable ? <p className="action-message action-message--error">Necesitas al menos un evento y un medio de pago activo.</p> : null}
      </section>
      {state.message ? <p className="action-message action-message--error">{state.message}</p> : null}
      <div className="sticky-form-actions"><Link className="secondary-button" href="/cobros">Cancelar</Link><button className="primary-button" disabled={pending || unavailable} type="submit">{pending ? "Guardando…" : "Registrar cobro"}</button></div>
    </form>
  );
}
