import Link from "next/link";
import { BoxesIcon } from "@/components/icons";

export default function LogisticsNotFound() {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="state">
          <span className="state-icon">
            <BoxesIcon width={24} height={24} />
          </span>
          <h2>No encontramos ese pedido</h2>
          <p>
            El pedido no existe o no pertenece a las bodegas asignadas a tu
            perfil logístico. Por seguridad no revelamos si el identificador
            pertenece a otro ámbito.
          </p>
          <Link className="btn btn-primary" href="/logistics/orders">
            Volver a pedidos
          </Link>
        </div>
      </div>
    </section>
  );
}
