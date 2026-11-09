import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { getSessionToken, requireAdmin } from "@/features/auth/session";
import { fetchAdminPayments } from "@/features/admin/api";
import {
  ESTADO_PAGO_LABEL,
  estadoPagoTone,
  formatFechaHora,
  formatMoney
} from "@/features/admin/format";
import type { EstadoPago } from "@/features/admin/types";
import { toActionError } from "@/lib/action-state";

export const metadata: Metadata = {
  title: "Pagos"
};

const PAGE_SIZE = 20;

const ESTADOS: readonly EstadoPago[] = [
  "PENDIENTE",
  "AUTORIZADO",
  "CAPTURADO",
  "RECHAZADO",
  "CANCELADO",
  "REEMBOLSO_PARCIAL",
  "REEMBOLSADO"
];

type PaymentsPageProps = {
  searchParams: Promise<{
    estado?: string | string[] | undefined;
    search?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPaymentsPage({ searchParams }: PaymentsPageProps) {
  await requireAdmin("/admin/payments");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const params = await searchParams;
  const rawEstado = first(params.estado);
  const estado = ESTADOS.includes(rawEstado as EstadoPago)
    ? (rawEstado as EstadoPago)
    : undefined;
  const search = first(params.search)?.trim() || undefined;
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: Awaited<ReturnType<typeof fetchAdminPayments>>;
  try {
    result = await fetchAdminPayments(token, {
      ...(estado ? { estado } : {}),
      ...(search ? { search } : {}),
      page,
      pageSize: PAGE_SIZE
    });
  } catch (error) {
    const state = toActionError(error, "No pudimos cargar los pagos.");
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

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Administración</p>
          <h1>Pagos</h1>
          <p>
            Consulta de los registros de pago existentes. No se capturan,
            reembolsan ni alteran pagos desde esta pantalla. No existen tablas de
            facturación, devoluciones o reembolsos que puedan consultarse.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <form className="filters-row" method="get" action="/admin/payments">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Pedido, comprador o proveedor"
              maxLength={120}
            />
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={estado ?? ""}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((value) => (
                <option key={value} value={value}>
                  {ESTADO_PAGO_LABEL[value]}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">
              Filtrar
            </button>
          </form>

          <p className="form-hint">
            {result.total} {result.total === 1 ? "pago registrado" : "pagos registrados"}.
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageIcon width={24} height={24} />}
              title="No hay pagos para este filtro"
              description="Cuando existan pagos que coincidan con la búsqueda, aparecerán aquí."
            />
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <caption className="sr-only">Pagos registrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Pedido</th>
                    <th scope="col">Comprador</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Proveedor</th>
                    <th scope="col">Monto</th>
                    <th scope="col">Creado</th>
                    <th scope="col">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/orders/${payment.pedidoId}`}
                        >
                          {payment.pedidoNumero}
                        </Link>
                      </td>
                      <td>{payment.compradorNombre}</td>
                      <td>{payment.vendedorNombre}</td>
                      <td>
                        <Badge tone={estadoPagoTone(payment.estado)}>
                          {ESTADO_PAGO_LABEL[payment.estado]}
                        </Badge>
                      </td>
                      <td>{payment.proveedor}</td>
                      <td>{formatMoney(payment.montoCentavos, payment.moneda)}</td>
                      <td>{formatFechaHora(payment.creadoEn)}</td>
                      <td>{formatFechaHora(payment.actualizadoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath="/admin/payments"
            query={{ estado, search }}
          />
        </div>
      </section>
    </>
  );
}
