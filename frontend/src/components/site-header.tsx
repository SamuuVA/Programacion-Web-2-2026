import Link from "next/link";
import {
  BoxesIcon,
  CartIcon,
  MapPinIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  ShieldCheckIcon,
  StoreIcon,
  UserIcon
} from "@/components/icons";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getSession } from "@/features/auth/session";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/products", label: "Catálogo" },
  { href: "/products?categoria=ELECTRONICA", label: "Electrónica" },
  { href: "/products?categoria=HOGAR", label: "Hogar" }
] as const;

export async function SiteHeader() {
  const session = await getSession();
  const isBuyer = session?.rol === "COMPRADOR" && session.compradorId !== null;
  const isAdmin = session?.rol === "ADMINISTRADOR";
  const isSeller = session?.rol === "VENDEDOR" && session.sellerId !== null;
  const isLogistics = session?.rol === "OPERADOR_LOGISTICO";
  const isSupervisor = session?.rol === "SUPERVISOR";

  const accountLinks = [
    ...(isBuyer
      ? [
          { href: "/cart", label: "Carrito", icon: <CartIcon width={18} height={18} /> },
          { href: "/orders", label: "Pedidos", icon: <PackageIcon width={18} height={18} /> },
          {
            href: "/addresses",
            label: "Direcciones",
            icon: <MapPinIcon width={18} height={18} />
          }
        ]
      : []),
    ...(isSeller
      ? [
          {
            href: "/seller",
            label: "Mi tienda",
            icon: <StoreIcon width={18} height={18} />
          }
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Administración",
            icon: <StoreIcon width={18} height={18} />
          }
        ]
      : []),
    ...(isLogistics
      ? [
          {
            href: "/logistics",
            label: "Logística",
            icon: <BoxesIcon width={18} height={18} />
          }
        ]
      : []),
    ...(isSupervisor
      ? [
          {
            href: "/supervisor",
            label: "Supervisión",
            icon: <ShieldCheckIcon width={18} height={18} />
          }
        ]
      : [])
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="NexusMarket, ir al inicio">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-name">
            Nexus<span>Market</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <form
          className="header-search"
          action="/products"
          method="get"
          role="search"
        >
          <label className="sr-only" htmlFor="header-search">
            Buscar productos
          </label>
          <input
            id="header-search"
            name="search"
            type="search"
            placeholder="Buscar en NexusMarket"
            autoComplete="off"
          />
          <button type="submit" aria-label="Buscar">
            <SearchIcon />
          </button>
        </form>

        <div className="header-account">
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              className="header-account-link"
              href={link.href}
            >
              {link.icon}
              <span className="header-account-label">{link.label}</span>
            </Link>
          ))}

          {session ? (
            <div className="header-user">
              <span className="header-user-name" title={session.correoElectronico}>
                <UserIcon width={18} height={18} />
                <span className="header-account-label">
                  {session.nombreCompleto.split(" ")[0]}
                </span>
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link className="btn btn-primary btn-sm" href="/login">
              Ingresar
            </Link>
          )}
        </div>

        <details className="mobile-menu">
          <summary aria-label="Abrir menú de navegación">
            <MenuIcon />
          </summary>
          <div className="mobile-menu-panel">
            <nav aria-label="Navegación móvil">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
              {accountLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
              {session ? (
                <>
                  <span className="mobile-menu-user">
                    {session.nombreCompleto} · {session.rol}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login">Ingresar</Link>
              )}
            </nav>
            <form action="/products" method="get" role="search">
              <label className="sr-only" htmlFor="mobile-search">
                Buscar productos
              </label>
              <input
                id="mobile-search"
                name="search"
                type="search"
                placeholder="Buscar productos"
                autoComplete="off"
              />
              <button className="btn btn-primary btn-sm" type="submit">
                Buscar
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
