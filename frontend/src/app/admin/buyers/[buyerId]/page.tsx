import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, UserIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminBuyer } from "@/features/admin/api";
import {
  ESTADO_COMPRADOR_LABEL,
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  ESTADO_USUARIO_LABEL,
  estadoCompradorTone,
  estadoPagoTone,
  estadoPedidoTone,
  estadoUsuarioTone,
  formatFechaHora,
  formatMoney
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

type BuyerPageProps = {
  params: Promise<{ buyerId: string }>;
};

export async function generateMetadata({
  params
}: BuyerPageProps): Promise<Metadata> {
  const { buyerId } = await params;
  if (!isAdminResourceId(buyerId)) {
    notFound();
  }
  return { title: "Detalle del comprador" };
}

export default async function AdminBuyerDetailPage({ params }: BuyerPageProps) {
  const { buyerId } = await params;
  if (!isAdminResourceId(buyerId)) {
    notFound();
  }

  await requireAdmin(`/admin/buyers/${buyerId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let buyer: Awaited<ReturnType<typeof fetchAdminBuyer>>;
  try {
    buyer = await fetchAdminBuyer(token, buyerId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el comprador.");
    return (
      <section className="section-tight">
        <div className="container">
          <ErrorState
            description={state.message ?? "Intenta de nuevo más tarde."}
            correlationId={state.correlationId}
          />
        </div>
      </section>
    );
  }

  if (!buyer) {
    notFound();
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/buyers">Compradores</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{buyer.nombreCompleto}</span>
          </nav>
          <p className="eyebrow">Comprador</p>
          <h1>{buyer.nombreCompleto}</h1>
          <div className="order-detail-badges">
            <Badge tone={estadoCompradorTone(buyer.estadoComercial)}>
              {ESTADO_COMPRADOR_LABEL[buyer.estadoComercial]}
            </Badge>
            <Badge tone={estadoUsuarioTone(buyer.usuarioEstado)}>
              {ESTADO_USUARIO_LABEL[buyer.usuarioEstado] ?? buyer.usuarioEstado}
            </Badge>
            <span className="order-detail-date">
              Registrado el {formatFechaHora(buyer.creadoEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Datos de la cuenta</h2>
              <ul className="order-items">
                <li>
                  <span>Nombre completo</span>
                  <strong>{buyer.nombreCompleto}</strong>
                </li>
                <li>
                  <span>Correo electrónico</span>
                  <strong>{buyer.correoElectronico}</strong>
                </li>
                <li>
                  <span>Estado comercial</span>
                  <strong>{ESTADO_COMPRADOR_LABEL[buyer.estadoComercial]}</strong>
                </li>
                <li>
                  <span>Pedidos registrados</span>
                  <strong>{buyer.pedidosCount}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Pedidos recientes</h2>
              {buyer.pedidos.length === 0 ? (
                <p className="form-hint">
                  El comprador todavía no tiene pedidos registrados.
                </p>
              ) : (
                <div className="order-list">
                  {buyer.pedidos.map((pedido) => (
                    <article className="order-card" key={pedido.id}>
                      <div className="order-card-head">
                        <div>
                          <p className="order-card-number">
                            <Link href={`/admin/orders/${pedido.id}`}>
                              {pedido.numero}
                            </Link>
                          </p>
                          <p className="order-card-seller">
                            {pedido.vendedorNombre} ·{" "}
                            {formatFechaHora(pedido.creadoEn)}
                          </p>
                        </div>
                        <div className="order-detail-badges">
                          <Badge tone={estadoPedidoTone(pedido.estado)}>
                            {ESTADO_PEDIDO_LABEL[pedido.estado]}
                          </Badge>
                          <Badge tone={estadoPagoTone(pedido.estadoPago)}>
                            {ESTADO_PAGO_LABEL[pedido.estadoPago]}
                          </Badge>
                        </div>
                      </div>
                      <div className="order-card-meta">
                        <strong>
                          {formatMoney(pedido.totalCentavos, pedido.moneda)}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Consulta de solo lectura</h2>
              <p className="form-hint">
                <UserIcon width={16} height={16} /> No se permite restringir,
                habilitar ni eliminar compradores desde esta pantalla. El registro
                público y la solicitud de vendedor son de una fase posterior.
              </p>
            </section>

            <section className="checkout-block">
              <h2>Datos minimizados</h2>
              <p className="form-hint">
                Esta vista omite documentos, credenciales, tokens y direcciones de
                entrega completas.
              </p>
            </section>

            <Link className="text-link" href="/admin/buyers">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a compradores
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
