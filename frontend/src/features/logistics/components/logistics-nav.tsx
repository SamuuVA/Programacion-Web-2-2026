"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/logistics", label: "Resumen", exact: true },
  { href: "/logistics/orders", label: "Pedidos", exact: false },
  { href: "/logistics/warehouses", label: "Bodegas", exact: false },
  { href: "/logistics/inventory", label: "Inventario", exact: false }
] as const;

export function LogisticsNav() {
  const pathname = usePathname();

  return (
    <nav className="seller-nav" aria-label="Espacio del operador logístico">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "seller-nav-link is-active" : "seller-nav-link"}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
