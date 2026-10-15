"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createEventAction, type EventFormState } from "@/features/events/actions";

type ClientOption = { id: number; name: string; phone: string | null };
const initialState: EventFormState = { status: "idle", message: "" };

export function EventForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);
  return (
    <form action={formAction} className="quote-form">
      <section className="form-panel">
        <div className="form-section-heading"><span className="eyebrow">Datos principales</span><h2>Crear evento</h2><p>Registra una presentación acordada directamente con el cliente.</p></div>
        <div className="form-grid form-grid--two">
          <label className="field-group field-group--wide"><span className="field-label">Cliente *</span><select className="text-field" defaultValue="" name="clientId" required><option disabled value="">Selecciona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.phone ? ` · ${client.phone}` : ""}</option>)}</select></label>
          <label className="field-group"><span className="field-label">Tipo de evento *</span><input className="text-field" maxLength={160} name="occasion" required /></label>
          <label className="field-group"><span className="field-label">Valor contratado *</span><input className="text-field" inputMode="numeric" min="0" name="agreedPriceCop" required step="1" type="number" /></label>
          <label className="field-group"><span className="field-label">Fecha *</span><input className="text-field" name="eventDate" required type="date" /></label>
          <label className="field-group"><span className="field-label">Hora</span><input className="text-field" name="startTime" type="time" /></label>
          <label className="field-group"><span className="field-label">Tandas *</span><input className="text-field" defaultValue="1" min="0.5" name="durationTandas" required step="0.5" type="number" /><small className="field-help">1 tanda = 1 hora</small></label>
          <label className="field-group"><span className="field-label">Descansos (min)</span><input className="text-field" defaultValue="0" min="0" name="breakMinutes" step="1" type="number" /></label>
          <label className="field-group"><span className="field-label">Lugar *</span><input className="text-field" maxLength={180} name="venue" required /></label>
          <label className="field-group"><span className="field-label">Dirección</span><input className="text-field" maxLength={240} name="address" /></label>
          <label className="field-group field-group--wide"><span className="field-label">Notas internas</span><textarea className="text-field text-field--area" maxLength={3000} name="internalNotes" rows={3} /></label>
        </div>
      </section>
      {state.message ? <p className="action-message action-message--error">{state.message}</p> : null}
      <div className="sticky-form-actions"><Link className="secondary-button" href="/eventos">Cancelar</Link><button className="primary-button" disabled={pending || clients.length === 0} type="submit">{pending ? "Guardando…" : "Crear evento"}</button></div>
    </form>
  );
}
