"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/supervisor", label: "Resumen", exact: true },
  { href: "/supervisor/orders", label: "Pedidos", exact: false },
  { href: "/supervisor/products", label: "Productos", exact: false },
  { href: "/supervisor/inventory", label: "Inventario", exact: false },
  { href: "/supervisor/shipments", label: "Envíos", exact: false },
  { href: "/supervisor/warehouses", label: "Almacenes", exact: false },
  { href: "/supervisor/sellers", label: "Vendedores", exact: false }
] as const;

export function SupervisorNav() {
  const pathname = usePathname();

  return (
    <nav className="seller-nav" aria-label="Espacio de supervisión">
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
