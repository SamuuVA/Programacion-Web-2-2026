import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  AdminBuyerDetail,
  AdminBuyerPage,
  AdminDashboard,
  AdminEnvelope,
  AdminInventoryPage,
  AdminMovementPage,
  AdminOrderDetail,
  AdminOrderPage,
  AdminPaymentPage,
  AdminProductDetail,
  AdminProductPage,
  AdminReports,
  AdminSellerDetail,
  AdminSellerPage,
  AdminUserDetail,
  AdminUserPage,
  AdminWarehouseDetail,
  AdminWarehousePage
} from "./types";

/**
 * Cliente de consulta del Administrador.
 *
 * Todas las funciones usan `GET`. Las dos altas administrativas existentes
 * (`/admin/sellers` y `/admin/logistics-operators`) se invocan desde sus
 * Server Actions y no forman parte de este cliente de lectura.
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

export async function fetchAdminDashboard(token: string): Promise<AdminDashboard> {
  const response = await apiRequest<AdminEnvelope<AdminDashboard>>(
    "/api/v1/admin/dashboard",
    { token }
  );
  return response.data;
}

export async function fetchAdminReports(token: string): Promise<AdminReports> {
  const response = await apiRequest<AdminEnvelope<AdminReports>>(
    "/api/v1/admin/reports",
    { token }
  );
  return response.data;
}

export async function fetchAdminUsers(
  token: string,
  params: {
    rol?: string;
    estado?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminUserPage> {
  const response = await apiRequest<AdminEnvelope<AdminUserPage>>(
    `/api/v1/admin/users${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminUser(
  token: string,
  userId: string
): Promise<AdminUserDetail | null> {
  return getOrNull<AdminUserDetail>(
    token,
    `/api/v1/admin/users/${encodeURIComponent(userId)}`
  );
}

export async function fetchAdminBuyers(
  token: string,
  params: {
    estadoComercial?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminBuyerPage> {
  const response = await apiRequest<AdminEnvelope<AdminBuyerPage>>(
    `/api/v1/admin/buyers${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminBuyer(
  token: string,
  buyerId: string
): Promise<AdminBuyerDetail | null> {
  return getOrNull<AdminBuyerDetail>(
    token,
    `/api/v1/admin/buyers/${encodeURIComponent(buyerId)}`
  );
}

export async function fetchAdminSellers(
  token: string,
  params: {
    estado?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminSellerPage> {
  const response = await apiRequest<AdminEnvelope<AdminSellerPage>>(
    `/api/v1/admin/sellers${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminSeller(
  token: string,
  sellerId: string
): Promise<AdminSellerDetail | null> {
  return getOrNull<AdminSellerDetail>(
    token,
    `/api/v1/admin/sellers/${encodeURIComponent(sellerId)}`
  );
}

export async function fetchAdminWarehouses(
  token: string,
  params: {
    estado?: string;
    vendedorId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminWarehousePage> {
  const response = await apiRequest<AdminEnvelope<AdminWarehousePage>>(
    `/api/v1/admin/warehouses${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminWarehouse(
  token: string,
  warehouseId: string
): Promise<AdminWarehouseDetail | null> {
  return getOrNull<AdminWarehouseDetail>(
    token,
    `/api/v1/admin/warehouses/${encodeURIComponent(warehouseId)}`
  );
}

export async function fetchAdminProducts(
  token: string,
  params: {
    estado?: string;
    categoria?: string;
    tipoEntrega?: string;
    vendedorId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminProductPage> {
  const response = await apiRequest<AdminEnvelope<AdminProductPage>>(
    `/api/v1/admin/products${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminProduct(
  token: string,
  productId: string
): Promise<AdminProductDetail | null> {
  return getOrNull<AdminProductDetail>(
    token,
    `/api/v1/admin/products/${encodeURIComponent(productId)}`
  );
}

export async function fetchAdminInventory(
  token: string,
  params: {
    bodegaId?: string;
    productoId?: string;
    vendedorId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminInventoryPage> {
  const response = await apiRequest<AdminEnvelope<AdminInventoryPage>>(
    `/api/v1/admin/inventory${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminMovements(
  token: string,
  params: {
    bodegaId?: string;
    productoId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminMovementPage> {
  const response = await apiRequest<AdminEnvelope<AdminMovementPage>>(
    `/api/v1/admin/inventory/movements${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminOrders(
  token: string,
  params: {
    estado?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminOrderPage> {
  const response = await apiRequest<AdminEnvelope<AdminOrderPage>>(
    `/api/v1/admin/orders${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminOrder(
  token: string,
  orderId: string
): Promise<AdminOrderDetail | null> {
  return getOrNull<AdminOrderDetail>(
    token,
    `/api/v1/admin/orders/${encodeURIComponent(orderId)}`
  );
}

export async function fetchAdminPayments(
  token: string,
  params: {
    estado?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AdminPaymentPage> {
  const response = await apiRequest<AdminEnvelope<AdminPaymentPage>>(
    `/api/v1/admin/payments${queryString(params)}`,
    { token }
  );
  return response.data;
}

async function getOrNull<T>(token: string, path: string): Promise<T | null> {
  try {
    const response = await apiRequest<AdminEnvelope<T>>(path, { token });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
