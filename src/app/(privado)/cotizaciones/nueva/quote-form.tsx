"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { formatCop } from "@/domain/quotes";
import { createQuoteDraftAction, type QuoteFormState } from "./actions";

type ClientOption = { id: number; name: string; phone: string | null };
type DraftOption = {
  localId: number;
  name: string;
  priceCop: string;
  durationTandas: string;
  breakMinutes: string;
  requiredAdvanceCop: string;
  customerConditions: string;
};

const initialState: QuoteFormState = { status: "idle", message: "" };
const firstOption: DraftOption = {
  localId: 1,
  name: "Opción principal",
  priceCop: "",
  durationTandas: "1",
  breakMinutes: "0",
  requiredAdvanceCop: "",
  customerConditions: "",
};

export function QuoteForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, pending] = useActionState(createQuoteDraftAction, initialState);
  const [options, setOptions] = useState<DraftOption[]>([firstOption]);
  const optionsJson = useMemo(
    () => JSON.stringify(options.map((option) => ({
      name: option.name,
      priceCop: option.priceCop,
      durationTandas: option.durationTandas,
      breakMinutes: option.breakMinutes,
      requiredAdvanceCop: option.requiredAdvanceCop,
      customerConditions: option.customerConditions,
    }))),
    [options],
  );

  function updateOption(localId: number, field: keyof Omit<DraftOption, "localId">, value: string) {
    setOptions((current) => current.map((option) => option.localId === localId ? { ...option, [field]: value } : option));
  }

  function addOption() {
    setOptions((current) => current.length >= 5 ? current : [...current, {
      ...firstOption,
      localId: Math.max(...current.map((option) => option.localId)) + 1,
      name: `Opción ${current.length + 1}`,
    }]);
  }

  return (
    <form action={formAction} className="quote-form">
      <input name="options" type="hidden" value={optionsJson} />

      <section className="form-panel">
        <div className="form-section-heading">
          <span className="step-number">01</span><span className="eyebrow">Evento y cliente</span>
          <h2>¿Para quién y cuándo?</h2>
          <p>Estos datos aparecerán en el documento que recibe el cliente.</p>
        </div>
        <div className="form-grid form-grid--two">
          <label className="field-group field-group--wide">
            <span className="field-label">Cliente *</span>
            <select className="text-field" defaultValue="" name="clientId" required>
              <option disabled value="">Selecciona un cliente</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.phone ? ` · ${client.phone}` : ""}</option>)}
            </select>
          </label>
          <label className="field-group"><span className="field-label">Fecha *</span><input className="text-field" name="eventDate" required type="date" /></label>
          <label className="field-group"><span className="field-label">Hora</span><input className="text-field" name="startTime" type="time" /></label>
          <label className="field-group"><span className="field-label">Tipo de evento *</span><input className="text-field" maxLength={160} name="occasion" placeholder="Cumpleaños, serenata…" required /></label>
          <label className="field-group"><span className="field-label">Lugar *</span><input className="text-field" maxLength={180} name="venue" placeholder="Salón o nombre del sitio" required /></label>
          <label className="field-group field-group--wide"><span className="field-label">Dirección o indicaciones</span><input className="text-field" maxLength={240} name="address" placeholder="Barrio, municipio o referencia" /></label>
        </div>
      </section>

      <section className="form-panel">
        <div className="form-section-heading form-section-heading--action">
          <div><span className="step-number">02</span><span className="eyebrow">Alternativas</span><h2>Opciones para el cliente</h2><p>Puedes ofrecer hasta cinco formatos en una misma cotización.</p></div>
          <button className="secondary-button" disabled={options.length >= 5} onClick={addOption} type="button">Agregar opción</button>
        </div>
        <div className="option-stack">
          {options.map((option, index) => (
            <article className="quote-option" key={option.localId}>
              <div className="quote-option__heading">
                <span>Opción {index + 1}</span>
                {options.length > 1 ? <button className="quiet-button" onClick={() => setOptions((current) => current.filter((item) => item.localId !== option.localId))} type="button">Quitar</button> : null}
              </div>
              <div className="form-grid form-grid--option">
                <label className="field-group field-group--wide"><span className="field-label">Nombre *</span><input className="text-field" maxLength={120} onChange={(event) => updateOption(option.localId, "name", event.target.value)} required value={option.name} /></label>
                <label className="field-group"><span className="field-label">Precio total (COP) *</span><input className="text-field" inputMode="numeric" min="0" onChange={(event) => updateOption(option.localId, "priceCop", event.target.value)} placeholder="1200000" required step="1" type="number" value={option.priceCop} />{option.priceCop ? <small className="money-preview">{formatCop(option.priceCop)}</small> : null}</label>
                <label className="field-group"><span className="field-label">Tandas *</span><input className="text-field" min="0.5" onChange={(event) => updateOption(option.localId, "durationTandas", event.target.value)} required step="0.5" type="number" value={option.durationTandas} /><small className="field-help">1 tanda = 1 hora</small></label>
                <label className="field-group"><span className="field-label">Descansos (min)</span><input className="text-field" min="0" onChange={(event) => updateOption(option.localId, "breakMinutes", event.target.value)} step="1" type="number" value={option.breakMinutes} /></label>
                <label className="field-group"><span className="field-label">Anticipo solicitado</span><input className="text-field" inputMode="numeric" min="0" onChange={(event) => updateOption(option.localId, "requiredAdvanceCop", event.target.value)} placeholder="Puede quedar vacío" step="1" type="number" value={option.requiredAdvanceCop} /></label>
                <label className="field-group field-group--wide"><span className="field-label">Condiciones de esta opción</span><textarea className="text-field text-field--area" maxLength={1000} onChange={(event) => updateOption(option.localId, "customerConditions", event.target.value)} placeholder="Integrantes incluidos u observaciones" rows={2} value={option.customerConditions} /></label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="form-panel">
        <div className="form-section-heading"><span className="step-number">03</span><span className="eyebrow">Vigencia y notas</span><h2>Últimos detalles</h2></div>
        <div className="form-grid form-grid--two">
          <label className="field-group"><span className="field-label">Vigencia (días) *</span><input className="text-field" defaultValue="7" max="90" min="1" name="validityDays" required type="number" /></label>
          <span />
          <label className="field-group"><span className="field-label">Condiciones generales</span><textarea className="text-field text-field--area" maxLength={3000} name="generalConditions" placeholder="Condiciones visibles para el cliente" rows={4} /></label>
          <label className="field-group"><span className="field-label">Notas internas</span><textarea className="text-field text-field--area" maxLength={3000} name="internalNotes" placeholder="Solo serán visibles dentro de MusicalPay" rows={4} /></label>
        </div>
      </section>

      {state.message ? <p aria-live="polite" className="action-message action-message--error">{state.message}</p> : null}
      <div className="sticky-form-actions">
        <Link className="secondary-button" href="/cotizaciones">Cancelar</Link>
        <button className="primary-button" disabled={pending || clients.length === 0} type="submit">{pending ? "Guardando…" : "Guardar borrador"}</button>
      </div>
    </form>
  );
}
