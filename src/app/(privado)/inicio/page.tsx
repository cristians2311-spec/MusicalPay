import Link from "next/link";

import { Icon } from "@/components/icon";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Jueves, 9 de octubre</span>
          <h1>Tu operación, al día.</h1>
          <p>Aquí aparecerá lo que requiere tu atención hoy.</p>
        </div>
        <Link className="primary-button" href="/cotizaciones/nueva">
          <Icon name="file" size={18} /> Nueva cotización
        </Link>
      </section>

      <section className="metric-grid" aria-label="Resumen del mes">
        <article className="metric-card metric-card--primary">
          <span>Eventos realizados</span>
          <strong>0</strong>
          <small>Octubre</small>
        </article>
        <article className="metric-card">
          <span>Valor contratado</span>
          <strong>{money.format(0)}</strong>
          <small>En eventos realizados</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="content-card content-card--wide">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Agenda</span>
              <h2>Próximos eventos</h2>
            </div>
            <Link className="text-link" href="/eventos">Ver agenda <Icon name="arrow-right" size={16} /></Link>
          </div>
          <div className="empty-state">
            <span className="empty-state__icon"><Icon name="calendar" size={24} /></span>
            <h3>Tu agenda está lista</h3>
            <p>Agrega el primer evento o acepta una cotización para verlo aquí.</p>
            <Link className="secondary-button" href="/eventos/nuevo">Crear evento</Link>
          </div>
        </article>

        <article className="content-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Por revisar</span>
              <h2>Pendientes</h2>
            </div>
          </div>
          <div className="attention-zero">
            <Icon name="sparkles" size={20} />
            <div><strong>Todo en orden</strong><span>No hay asuntos pendientes.</span></div>
          </div>
          <div className="pending-list" aria-label="Resumen de pendientes">
            <div><span>Cobros de clientes</span><strong>{money.format(0)}</strong></div>
            <div><span>Pagos a músicos</span><strong>{money.format(0)}</strong></div>
            <div><span>Gastos pendientes</span><strong>{money.format(0)}</strong></div>
          </div>
          <Link className="secondary-button secondary-button--full" href="/pagos">
            <Icon name="hand-coins" size={17} /> Preparar pagos
          </Link>
        </article>
      </section>
    </div>
  );
}

