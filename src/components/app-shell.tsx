import type { ReactNode } from "react";

import { DesktopNavigation, MobileNavigation } from "@/components/app-navigation";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const today = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Brand />
        <DesktopNavigation />
        <div className="app-sidebar__foot">
          <span className="status-dot" aria-hidden="true" />
          <span>Sesión privada</span>
        </div>
      </aside>

      <div className="app-stage">
        <header className="app-header">
          <div className="app-header__mobile-brand">
            <Brand compact />
          </div>
          <div className="app-header__context">
            <span className="eyebrow">Panel privado</span>
            <span className="app-header__date">{today}</span>
          </div>
          <div className="app-header__account">
            <a className="icon-button" href="/inicio#pendientes" aria-label="Ver pendientes">
              <Icon name="bell" size={20} />
            </a>
            <span className="avatar" aria-hidden="true">
              CS
            </span>
            <span className="account-copy">
              <strong>Cristian Santiago</strong>
              <small>Administrador</small>
            </span>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>

      <MobileNavigation />
    </div>
  );
}

