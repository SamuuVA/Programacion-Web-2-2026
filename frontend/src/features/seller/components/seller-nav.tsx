"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/seller", label: "Resumen", exact: true },
  { href: "/seller/profile", label: "Perfil", exact: false },
  { href: "/seller/products", label: "Productos", exact: false },
  { href: "/seller/warehouses", label: "Bodegas", exact: false },
  { href: "/seller/inventory", label: "Inventario", exact: false },
  { href: "/seller/orders", label: "Pedidos", exact: false }
] as const;

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav className="seller-nav" aria-label="Espacio del vendedor">
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
