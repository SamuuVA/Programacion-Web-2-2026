import Link from "next/link";
import { MenuIcon, SearchIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/products", label: "Catálogo" },
  { href: "/products?categoria=ELECTRONICA", label: "Electrónica" },
  { href: "/products?categoria=HOGAR", label: "Hogar" }
] as const;

export function SiteHeader() {
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
