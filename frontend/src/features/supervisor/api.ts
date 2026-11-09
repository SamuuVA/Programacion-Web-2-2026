import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  SupervisorDashboard,
  SupervisorDashboardEnvelope,
  SupervisorInventoryPageEnvelope,
  SupervisorInventoryPosition,
  SupervisorOrderDetail,
  SupervisorOrderEnvelope,
  SupervisorOrderPageEnvelope,
  SupervisorOrderSummary,
  SupervisorPage,
  SupervisorProductDetail,
  SupervisorProductEnvelope,
  SupervisorProductPageEnvelope,
  SupervisorProductSummary,
  SupervisorSeller,
  SupervisorSellerPageEnvelope,
  SupervisorShipmentPageEnvelope,
  SupervisorShipmentSummary,
  SupervisorWarehouse,
  SupervisorWarehouseListEnvelope
} from "./types";

/**
 * Cliente de solo lectura del Supervisor (`SUP-01`).
 *
 * Todas las funciones usan `GET`. No existen funciones de escritura: si una
 * pantalla necesitara mutar, sería un defecto de diseño y no una capacidad del
 * perfil.
 */

function queryString(
  params: Readonly<Record<string, string | number | undefined>>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const suffix = search.toString();
  return suffix ? `?${suffix}` : "";
}

export async function fetchSupervisorDashboard(
  token: string
): Promise<SupervisorDashboard> {
  const response = await apiRequest<SupervisorDashboardEnvelope>(
    "/api/v1/supervisor/dashboard",
    { token }
  );
  return response.data;
}

export async function fetchSupervisorOrders(
  token: string,
  params: { estado?: string; page?: number; pageSize?: number } = {}
): Promise<SupervisorPage<SupervisorOrderSummary>> {
  const response = await apiRequest<SupervisorOrderPageEnvelope>(
    `/api/v1/supervisor/orders${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchSupervisorOrder(
  token: string,
  orderId: string
): Promise<SupervisorOrderDetail | null> {
  try {
    const response = await apiRequest<SupervisorOrderEnvelope>(
      `/api/v1/supervisor/orders/${encodeURIComponent(orderId)}`,
      { token }
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchSupervisorProducts(
  token: string,
  params: {
    estado?: string;
    categoria?: string;
    vendedorId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<SupervisorPage<SupervisorProductSummary>> {
  const response = await apiRequest<SupervisorProductPageEnvelope>(
    `/api/v1/supervisor/products${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchSupervisorProduct(
  token: string,
  productId: string
): Promise<SupervisorProductDetail | null> {
  try {
    const response = await apiRequest<SupervisorProductEnvelope>(
      `/api/v1/supervisor/products/${encodeURIComponent(productId)}`,
      { token }
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchSupervisorWarehouses(
  token: string
): Promise<readonly SupervisorWarehouse[]> {
  const response = await apiRequest<SupervisorWarehouseListEnvelope>(
    "/api/v1/supervisor/warehouses",
    { token }
  );
  return response.data;
}

export async function fetchSupervisorInventory(
  token: string,
  params: {
    bodegaId?: string;
    productoId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<SupervisorPage<SupervisorInventoryPosition>> {
  const response = await apiRequest<SupervisorInventoryPageEnvelope>(
    `/api/v1/supervisor/inventory${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchSupervisorShipments(
  token: string,
  params: { estado?: string; pedidoId?: string; page?: number; pageSize?: number } = {}
): Promise<SupervisorPage<SupervisorShipmentSummary>> {
  const response = await apiRequest<SupervisorShipmentPageEnvelope>(
    `/api/v1/supervisor/shipments${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchSupervisorSellers(
  token: string,
  params: { estado?: string; page?: number; pageSize?: number } = {}
): Promise<SupervisorPage<SupervisorSeller>> {
  const response = await apiRequest<SupervisorSellerPageEnvelope>(
    `/api/v1/supervisor/sellers${queryString(params)}`,
    { token }
  );
  return response.data;
}
