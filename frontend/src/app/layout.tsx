import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "NexusMarket · Productos de vendedores reales",
    template: "%s · NexusMarket"
  },
  description:
    "Explora el catálogo de NexusMarket: productos de vendedores activos, con precios e inventario administrados por la plataforma.",
  applicationName: "NexusMarket"
};

export const viewport: Viewport = {
  themeColor: "#24483d",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
