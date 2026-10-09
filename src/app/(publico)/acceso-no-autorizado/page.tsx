import Link from "next/link";

import { Brand } from "@/components/brand";

export default function UnauthorizedPage() {
  return (
    <main className="centered-page">
      <section className="message-card">
        <Brand />
        <span className="eyebrow">Acceso restringido</span>
        <h1>Esta cuenta no está autorizada</h1>
        <p>Cierra la sesión de Google e ingresa con la cuenta habilitada para MusicalPay.</p>
        <Link className="primary-button" href="/iniciar-sesion">Volver al acceso</Link>
      </section>
    </main>
  );
}

