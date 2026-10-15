"use client";

import { useActionState, useEffect, useRef } from "react";

import { createMemberAction, type MemberFormState } from "@/features/members/actions";

type RoleOption = {
  id: number;
  name: string;
};

const initialMemberFormState: MemberFormState = { status: "idle", message: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="field-error">{messages[0]}</span>;
}

export function MemberForm({ roles }: { roles: RoleOption[] }) {
  const [state, formAction, pending] = useActionState(
    createMemberAction,
    initialMemberFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="record-form">
      <div className="form-section-heading">
        <span className="eyebrow">Nuevo integrante</span>
        <h2>Agregar músico</h2>
        <p>Asigna todos los roles que esta persona puede cubrir en una presentación.</p>
      </div>

      <label className="field-label" htmlFor="member-name">
        Nombre <span aria-hidden="true">*</span>
      </label>
      <input
        aria-describedby="member-name-error"
        aria-invalid={Boolean(state.errors?.name)}
        className="text-field"
        id="member-name"
        maxLength={160}
        name="name"
        placeholder="Ej. Andrés Pérez"
        required
      />
      <div id="member-name-error"><FieldError messages={state.errors?.name} /></div>

      <label className="field-label" htmlFor="member-nickname">Apodo</label>
      <input
        aria-invalid={Boolean(state.errors?.nickname)}
        className="text-field"
        id="member-nickname"
        maxLength={160}
        name="nickname"
        placeholder="Nombre corto para identificarlo"
      />
      <FieldError messages={state.errors?.nickname} />

      <label className="field-label" htmlFor="member-phone">WhatsApp o teléfono</label>
      <input
        aria-invalid={Boolean(state.errors?.phone)}
        autoComplete="tel"
        className="text-field"
        id="member-phone"
        inputMode="tel"
        maxLength={30}
        name="phone"
        placeholder="300 123 4567"
      />
      <FieldError messages={state.errors?.phone} />

      <fieldset className="role-picker">
        <legend className="field-label">
          Roles <span aria-hidden="true">*</span>
        </legend>
        <div className="role-picker__options">
          {roles.map((role) => (
            <label className="role-option" key={role.id}>
              <input name="roleIds" type="checkbox" value={role.id} />
              <span>{role.name}</span>
            </label>
          ))}
        </div>
        <FieldError messages={state.errors?.roleIds} />
      </fieldset>

      <label className="field-label" htmlFor="member-notes">Notas</label>
      <textarea
        aria-invalid={Boolean(state.errors?.notes)}
        className="text-field text-field--area"
        id="member-notes"
        maxLength={1000}
        name="notes"
        placeholder="Disponibilidad o información útil"
        rows={3}
      />
      <FieldError messages={state.errors?.notes} />

      {state.message ? (
        <p aria-live="polite" className={`action-message action-message--${state.status}`}>
          {state.message}
        </p>
      ) : null}
      <button
        className="primary-button primary-button--full"
        disabled={pending || roles.length === 0}
        type="submit"
      >
        {pending ? "Guardando…" : "Guardar músico"}
      </button>
    </form>
  );
}
