import Link from "next/link";
import { CompassIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <EmptyState
          icon={<CompassIcon width={24} height={24} />}
          title="Página no encontrada"
          description="La dirección que abriste no existe en NexusMarket. Revisa el enlace o vuelve al catálogo."
          action={{ href: "/products", label: "Ir al catálogo" }}
        />
        <p className="section-subtitle" style={{ marginTop: 18, textAlign: "center" }}>
          También puedes <Link className="text-link" href="/">volver al inicio</Link>.
        </p>
      </div>
    </section>
  );
}
