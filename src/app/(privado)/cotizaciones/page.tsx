import Link from "next/link";

import { Icon } from "@/components/icon";

export default function QuotesPage() {
  return <ModulePlaceholder eyebrow="Ventas" title="Cotizaciones" description="Crea propuestas profesionales, ofrece alternativas y conserva cada revisión emitida." action="Nueva cotización" href="/cotizaciones/nueva" />;
}

function ModulePlaceholder({ eyebrow, title, description, action, href }: { eyebrow: string; title: string; description: string; action: string; href: string }) {
  return <div className="page-stack"><section className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><Link className="primary-button" href={href}><Icon name="file" size={18}/>{action}</Link></section><article className="content-card"><div className="empty-state"><span className="empty-state__icon"><Icon name="file" size={24}/></span><h2>Aún no hay {title.toLocaleLowerCase("es-CO")}</h2><p>Los registros nuevos aparecerán aquí con sus estados y fechas.</p></div></article></div>;
}

export { ModulePlaceholder };

