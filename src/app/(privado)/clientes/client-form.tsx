"use client";

import { useActionState, useEffect, useRef } from "react";

import { createClientAction, type ClientFormState } from "./actions";

const initialClientFormState: ClientFormState = { status: "idle", message: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="field-error">{messages[0]}</span>;
}

export function ClientForm() {
  const [state, formAction, pending] = useActionState(createClientAction, initialClientFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="record-form">
      <div className="form-section-heading">
        <span className="eyebrow">Nuevo registro</span>
        <h2>Agregar cliente</h2>
        <p>Guarda lo mínimo. Podrás completar sus datos cuando prepares la cotización.</p>
      </div>

      <label className="field-label" htmlFor="client-name">Nombre <span aria-hidden="true">*</span></label>
      <input aria-describedby="client-name-error" aria-invalid={Boolean(state.errors?.name)} className="text-field" id="client-name" maxLength={160} name="name" placeholder="Ej. Laura Martínez" required />
      <div id="client-name-error"><FieldError messages={state.errors?.name} /></div>

      <label className="field-label" htmlFor="client-phone">WhatsApp o teléfono</label>
      <input aria-describedby="client-phone-help client-phone-error" aria-invalid={Boolean(state.errors?.phone)} autoComplete="tel" className="text-field" id="client-phone" inputMode="tel" maxLength={30} name="phone" placeholder="300 123 4567" />
      <small className="field-help" id="client-phone-help">Los celulares colombianos se guardan con +57.</small>
      <div id="client-phone-error"><FieldError messages={state.errors?.phone} /></div>

      <label className="field-label" htmlFor="client-notes">Notas</label>
      <textarea aria-invalid={Boolean(state.errors?.notes)} className="text-field text-field--area" id="client-notes" maxLength={1000} name="notes" placeholder="Preferencias o contexto útil" rows={4} />
      <FieldError messages={state.errors?.notes} />

      {state.message ? <p aria-live="polite" className={`action-message action-message--${state.status}`}>{state.message}</p> : null}
      <button className="primary-button primary-button--full" disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar cliente"}</button>
    </form>
  );
}
