import Link from "next/link";

const EXPLORAR = [
  { href: "/", label: "Inicio" },
  { href: "/products", label: "Todo el catálogo" },
  { href: "/products?orden=recientes", label: "Recién llegados" }
] as const;

const CATEGORIAS = [
  { href: "/products?categoria=ELECTRONICA", label: "Electrónica" },
  { href: "/products?categoria=ROPA", label: "Ropa" },
  { href: "/products?categoria=HOGAR", label: "Hogar" },
  { href: "/products?categoria=DIGITAL", label: "Digital" }
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="footer-brand" href="/" aria-label="NexusMarket, ir al inicio">
              <span className="brand-mark" aria-hidden="true">
                N
              </span>
              <strong>NexusMarket</strong>
            </Link>
            <p className="footer-about">
              Un marketplace para descubrir productos de vendedores activos, con
              inventario y precios administrados por la plataforma.
            </p>
          </div>

          <div className="footer-column">
            <h3>Explorar</h3>
            <ul>
              {EXPLORAR.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h3>Categorías</h3>
            <ul>
              {CATEGORIAS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h3>Esta entrega</h3>
            <ul>
              <li>Catálogo público</li>
              <li>Búsqueda y filtros</li>
              <li>Detalle de producto</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 NexusMarket · Primera entrega</span>
          <span>Datos servidos por la API de NexusMarket</span>
        </div>
      </div>
    </footer>
  );
}
