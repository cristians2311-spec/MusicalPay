"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  configured: boolean;
};

export function LoginForm({ configured }: LoginFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "openid",
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch {
      setError("No fue posible iniciar sesión. Revisa la configuración e inténtalo otra vez.");
      setIsPending(false);
    }
  }

  return (
    <div className="login-actions">
      <button
        className="google-button"
        type="button"
        onClick={signInWithGoogle}
        disabled={!configured || isPending}
      >
        <span className="google-mark" aria-hidden="true">G</span>
        {isPending ? "Abriendo Google…" : "Continuar con Google"}
      </button>
      {configured ? (
        <p className="login-hint">Solo la cuenta autorizada puede entrar.</p>
      ) : (
        <p className="form-message" role="status">
          Completa las variables de Supabase en <code>.env.local</code> para habilitar el acceso.
        </p>
      )}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}

