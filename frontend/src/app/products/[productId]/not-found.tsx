import Link from "next/link";
import { CompassIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProductNotFound() {
  return (
    <section className="section">
      <div className="container">
        <EmptyState
          icon={<CompassIcon width={24} height={24} />}
          title="Producto no encontrado"
          description="El producto no existe o ya no está publicado. Puede que el vendedor lo haya retirado del catálogo."
          action={{ href: "/products", label: "Volver al catálogo" }}
        />
        <p className="section-subtitle" style={{ marginTop: 18, textAlign: "center" }}>
          También puedes <Link className="text-link" href="/">ir al inicio</Link>.
        </p>
      </div>
    </section>
  );
}
