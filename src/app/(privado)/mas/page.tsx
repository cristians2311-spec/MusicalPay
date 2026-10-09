import Link from "next/link";

import { Icon } from "@/components/icon";
import { secondaryNavigationItems } from "@/lib/navigation";

export default function MorePage() {
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Navegación</span><h1>Más opciones</h1></div></section>
      <div className="more-grid">
        {secondaryNavigationItems.map(({ href, label, icon }) => (
          <Link className="more-card" href={href} key={href}>
            <Icon name={icon} size={22} /><span>{label}</span><small>Abrir módulo</small>
          </Link>
        ))}
      </div>
    </div>
  );
}

