import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, BoxesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminWarehouse } from "@/features/admin/api";
import {
  ESTADO_BODEGA_LABEL,
  ESTADO_OPERADOR_LABEL,
  MOVIMIENTO_LABEL,
  TIPO_BODEGA_LABEL,
  estadoBodegaTone,
  estadoOperadorAdminTone,
  formatFechaHora
} from "@/features/admin/format";
import { isAdminResourceId } from "@/features/admin/ids";
import { toActionError } from "@/lib/action-state";

type WarehousePageProps = {
  params: Promise<{ warehouseId: string }>;
};

export async function generateMetadata({
  params
}: WarehousePageProps): Promise<Metadata> {
  const { warehouseId } = await params;
  if (!isAdminResourceId(warehouseId)) {
    notFound();
  }
  return { title: "Detalle del almacén" };
}

export default async function AdminWarehouseDetailPage({
  params
}: WarehousePageProps) {
  const { warehouseId } = await params;
  if (!isAdminResourceId(warehouseId)) {
    notFound();
  }

  await requireAdmin(`/admin/warehouses/${warehouseId}`);
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  let warehouse: Awaited<ReturnType<typeof fetchAdminWarehouse>>;
  try {
    warehouse = await fetchAdminWarehouse(token, warehouseId);
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar el almacén.");
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

  if (!warehouse) {
    notFound();
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link href="/admin/warehouses">Almacenes</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{warehouse.nombre}</span>
          </nav>
          <p className="eyebrow">Almacén</p>
          <h1>{warehouse.nombre}</h1>
          <div className="order-detail-badges">
            <Badge tone={estadoBodegaTone(warehouse.estado)}>
              {ESTADO_BODEGA_LABEL[warehouse.estado]}
            </Badge>
            <Badge tone="neutral">{TIPO_BODEGA_LABEL[warehouse.tipo]}</Badge>
            <span className="order-detail-date">
              Creado el {formatFechaHora(warehouse.creadaEn)}
            </span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container seller-detail-layout">
          <div className="seller-detail-main">
            <section className="checkout-block">
              <h2>Datos del almacén</h2>
              <ul className="order-items">
                <li>
                  <span>Ubicación</span>
                  <strong>{warehouse.ubicacion}</strong>
                </li>
                <li>
                  <span>Vendedor asociado</span>
                  <strong>{warehouse.vendedorNombre ?? "Marketplace"}</strong>
                </li>
                <li>
                  <span>Correo del vendedor</span>
                  <strong>{warehouse.vendedorCorreo ?? "No aplica"}</strong>
                </li>
                <li>
                  <span>Productos</span>
                  <strong>{warehouse.productosCount}</strong>
                </li>
                <li>
                  <span>Unidades disponibles</span>
                  <strong>{warehouse.inventarioDisponible}</strong>
                </li>
              </ul>
            </section>

            <section className="checkout-block">
              <h2>Inventario del almacén</h2>
              {warehouse.inventario.length === 0 ? (
                <p className="form-hint">
                  No hay posiciones de inventario registradas en este almacén.
                </p>
              ) : (
                <div className="seller-table-wrap">
                  <table className="seller-table">
                    <caption className="sr-only">
                      Inventario por producto en el almacén
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">En mano</th>
                        <th scope="col">Reservado</th>
                        <th scope="col">No disponible</th>
                        <th scope="col">Disponible</th>
                        <th scope="col">Actualizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouse.inventario.map((position) => (
                        <tr key={position.productoId}>
                          <td>
                            <strong>
                              <Link href={`/admin/products/${position.productoId}`}>
                                {position.productoNombre}
                              </Link>
                            </strong>
                            <span className="seller-product-meta">
                              SKU {position.sku}
                            </span>
                          </td>
                          <td>{position.onHand}</td>
                          <td>{position.reserved}</td>
                          <td>{position.unavailable}</td>
                          <td>
                            <strong>{position.disponible}</strong>
                          </td>
                          <td>{formatFechaHora(position.actualizadoEn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="checkout-block">
              <h2>Movimientos de inventario</h2>
              {warehouse.movimientos.length === 0 ? (
                <p className="form-hint">
                  Todavía no hay movimientos registrados en este almacén.
                </p>
              ) : (
                <div className="seller-table-wrap">
                  <table className="seller-table">
                    <caption className="sr-only">
                      Movimientos de inventario del almacén
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Cantidad</th>
                        <th scope="col">Referencia</th>
                        <th scope="col">Ocurrido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouse.movimientos.map((movement) => (
                        <tr key={movement.id}>
                          <td>
                            <strong>{movement.productoNombre}</strong>
                            <span className="seller-product-meta">
                              SKU {movement.sku}
                            </span>
                          </td>
                          <td>{MOVIMIENTO_LABEL[movement.tipo] ?? movement.tipo}</td>
                          <td>{movement.cantidad}</td>
                          <td>
                            {movement.referenciaTipo} {movement.referenciaId}
                            {movement.motivo ? (
                              <span className="seller-product-meta">
                                {movement.motivo}
                              </span>
                            ) : null}
                          </td>
                          <td>{formatFechaHora(movement.ocurridoEn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="checkout-block">
              <h2>Operadores asignados</h2>
              {warehouse.operadores.length === 0 ? (
                <p className="form-hint">
                  No hay operadores logísticos asignados a este almacén.
                </p>
              ) : (
                <ul className="order-items">
                  {warehouse.operadores.map((operator) => (
                    <li key={operator.id}>
                      <div>
                        <strong>{operator.nombreOperador}</strong>
                        <span>
                          Asignado el {formatFechaHora(operator.asignadaEn)}
                        </span>
                      </div>
                      <Badge tone={estadoOperadorAdminTone(operator.estado)}>
                        {ESTADO_OPERADOR_LABEL[operator.estado]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="seller-detail-aside">
            <section className="checkout-block">
              <h2>Consulta de solo lectura</h2>
              <p className="form-hint">
                <BoxesIcon width={16} height={16} /> No se permite cambiar el
                propietario, eliminar el almacén ni ajustar su inventario desde esta
                pantalla.
              </p>
            </section>

            {warehouse.vendedorId ? (
              <section className="checkout-block">
                <h2>Vendedor</h2>
                <Link
                  className="text-link"
                  href={`/admin/sellers/${warehouse.vendedorId}`}
                >
                  Ver vendedor asociado
                </Link>
              </section>
            ) : null}

            <Link className="text-link" href="/admin/warehouses">
              <ArrowRightIcon
                width={16}
                height={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Volver a almacenes
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
