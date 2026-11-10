"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/users", label: "Usuarios", exact: false },
  { href: "/admin/seller-applications", label: "Solicitudes", exact: false },
  { href: "/admin/sellers", label: "Vendedores", exact: false },
  { href: "/admin/buyers", label: "Compradores", exact: false },
  { href: "/admin/warehouses", label: "Almacenes", exact: false },
  { href: "/admin/products", label: "Productos", exact: false },
  { href: "/admin/inventory", label: "Inventario", exact: false },
  { href: "/admin/orders", label: "Pedidos", exact: false },
  { href: "/admin/payments", label: "Pagos", exact: false },
  { href: "/admin/reports", label: "Reportes", exact: false }
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="seller-nav" aria-label="Espacio administrativo">
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
