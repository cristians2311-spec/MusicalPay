import Link from "next/link";

import { Icon } from "@/components/ui/icon";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="home-intro">
        <div className="home-intro__copy">
          <span className="eyebrow">Centro de operación</span>
          <h1>
            Tu música en escena.
            <br />
            Tus cuentas en orden.
          </h1>
          <p>Controla cotizaciones, agenda y pagos desde un solo lugar.</p>
        </div>
        <div className="home-intro__action">
          <span>Siguiente paso</span>
          <strong>Prepara una propuesta profesional para tu próximo cliente.</strong>
          <Link className="primary-button" href="/cotizaciones/nueva">
            <Icon name="file" size={18} /> Nueva cotización
          </Link>
        </div>
      </section>

      <section className="metric-grid" aria-label="Resumen del mes">
        <article className="metric-card">
          <span>Eventos este mes</span>
          <div>
            <strong>0</strong>
            <small>realizados</small>
          </div>
        </article>
        <article className="metric-card">
          <span>Valor contratado</span>
          <div>
            <strong>{money.format(0)}</strong>
            <small>en eventos realizados</small>
          </div>
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
            <Link className="secondary-button" href="/eventos">Ir a eventos</Link>
          </div>
        </article>

        <article className="content-card" id="pendientes">
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

