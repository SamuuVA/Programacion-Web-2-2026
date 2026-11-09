import Link from "next/link";
import { StoreIcon } from "@/components/icons";

export default function SellerNotFound() {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="state">
          <span className="state-icon">
            <StoreIcon width={24} height={24} />
          </span>
          <h2>No encontramos ese recurso</h2>
          <p>
            El producto o pedido no existe o no pertenece a tu tienda. Por
            seguridad no revelamos si el identificador pertenece a otro
            vendedor.
          </p>
          <Link className="btn btn-primary" href="/seller">
            Volver a mi tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
