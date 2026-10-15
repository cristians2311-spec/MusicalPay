"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import {
  primaryNavigationItems,
  secondaryNavigationItems,
  type NavigationItem,
} from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({ item }: { item: NavigationItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);

  return (
    <Link
      className="nav-link"
      data-active={active}
      href={item.href}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={item.icon} size={20} />
      <span>{item.label}</span>
    </Link>
  );
}

export function DesktopNavigation() {
  return (
    <nav className="desktop-navigation" aria-label="Navegación principal">
      <div className="desktop-navigation__group">
        {primaryNavigationItems.map((item) => (
          <NavigationLink item={item} key={item.href} />
        ))}
      </div>
      <span className="desktop-navigation__label">Administración</span>
      <div className="desktop-navigation__group">
        {secondaryNavigationItems.map((item) => (
          <NavigationLink item={item} key={item.href} />
        ))}
      </div>
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const moreActive = secondaryNavigationItems.some((item) => isActive(pathname, item.href));

  return (
    <nav className="mobile-navigation" aria-label="Navegación móvil">
      {primaryNavigationItems.map((item) => (
        <NavigationLink item={item} key={item.href} />
      ))}
      <Link
        className="nav-link"
        data-active={moreActive}
        href="/mas"
        aria-current={moreActive || pathname === "/mas" ? "page" : undefined}
      >
        <Icon name="menu" size={20} />
        <span>Más</span>
      </Link>
    </nav>
  );
}


