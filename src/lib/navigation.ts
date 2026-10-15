import type { IconName } from "@/components/ui/icon";

export type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
};

export const primaryNavigationItems: NavigationItem[] = [
  { href: "/inicio", label: "Inicio", icon: "home" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: "file" },
  { href: "/eventos", label: "Eventos", icon: "calendar" },
  { href: "/pagos", label: "Pagos", icon: "hand-coins" },
];

export const secondaryNavigationItems: NavigationItem[] = [
  { href: "/cobros", label: "Cobros", icon: "coins" },
  { href: "/clientes", label: "Clientes", icon: "users" },
  { href: "/musicos", label: "Músicos", icon: "wallet" },
  { href: "/estadisticas", label: "Estadísticas", icon: "chart" },
  { href: "/configuracion", label: "Configuración", icon: "settings" },
];

