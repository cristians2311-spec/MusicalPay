import type { ReactNode } from "react";

import { DesktopNavigation, MobileNavigation } from "@/components/app-navigation";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
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
          <Brand compact />
          <div>
            <button className="icon-button" type="button" aria-label="Ver avisos">
              <Icon name="bell" size={20} />
            </button>
            <span className="avatar" aria-label="Cuenta de Cristian Santiago">
              CS
            </span>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>

      <MobileNavigation />
    </div>
  );
}

