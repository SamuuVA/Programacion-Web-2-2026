import Link from "next/link";
import { ShieldCheckIcon } from "@/components/icons";

export default function AdminNotFound() {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="state">
          <span className="state-icon">
            <ShieldCheckIcon width={24} height={24} />
          </span>
          <h2>No encontramos ese recurso</h2>
          <p>
            El identificador no corresponde a un registro visible para el espacio
            administrativo. La consulta es de solo lectura.
          </p>
          <Link className="btn btn-primary" href="/admin">
            Volver al resumen
          </Link>
        </div>
      </div>
    </section>
  );
}
