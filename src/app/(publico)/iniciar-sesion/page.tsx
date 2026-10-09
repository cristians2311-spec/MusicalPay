import type { Metadata } from "next";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { hasSupabaseConfig } from "@/lib/env";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-story" aria-label="Presentación de MusicalPay">
        <div className="login-story__content">
          <span className="eyebrow eyebrow--light">Gestión musical, en un solo lugar</span>
          <h1>Cada presentación clara. Cada pago en su lugar.</h1>
          <p>
            Organiza cotizaciones, eventos y pagos de Cristian Santiago Music sin
            volver a cruzar notas, chats y hojas de cálculo.
          </p>
        </div>
        <div className="rhythm-lines" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <Brand />
          <div className="login-panel__copy">
            <span className="eyebrow">Acceso privado</span>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa con la cuenta de Google autorizada para administrar la agrupación.</p>
          </div>
          <LoginForm configured={hasSupabaseConfig()} />
          <small className="login-footer">Uso exclusivo de Cristian Santiago Music</small>
        </div>
      </section>
    </main>
  );
}

