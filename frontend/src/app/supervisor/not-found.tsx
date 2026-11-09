import Link from "next/link";
import { ShieldCheckIcon } from "@/components/icons";

export default function SupervisorNotFound() {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="state">
          <span className="state-icon">
            <ShieldCheckIcon width={24} height={24} />
          </span>
          <h2>No encontramos ese recurso</h2>
          <p>
            El identificador no corresponde a un pedido o producto visible para
            el perfil de supervisión. La consulta es de solo lectura.
          </p>
          <Link className="btn btn-primary" href="/supervisor">
            Volver al resumen
          </Link>
        </div>
      </div>
    </section>
  );
}
