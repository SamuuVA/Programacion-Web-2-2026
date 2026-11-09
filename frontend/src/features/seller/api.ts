import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  SellerInventoryListEnvelope,
  SellerInventoryPosition,
  SellerOrderDetail,
  SellerOrderEnvelope,
  SellerOrderListEnvelope,
  SellerOrderSummary,
  SellerProduct,
  SellerProductEnvelope,
  SellerProductListEnvelope,
  SellerProfile,
  SellerProfileEnvelope,
  SellerWarehouse,
  SellerWarehouseListEnvelope
} from "./types";

export async function fetchSellerProfile(token: string): Promise<SellerProfile> {
  const response = await apiRequest<SellerProfileEnvelope>(
    "/api/v1/seller/profile",
    { token }
  );
  return response.data;
}

export async function fetchSellerProducts(
  token: string
): Promise<readonly SellerProduct[]> {
  const response = await apiRequest<SellerProductListEnvelope>(
    "/api/v1/seller/products",
    { token }
  );
  return response.data;
}

export async function fetchSellerProduct(
  token: string,
  productId: string
): Promise<SellerProduct | null> {
  try {
    const response = await apiRequest<SellerProductEnvelope>(
      `/api/v1/seller/products/${encodeURIComponent(productId)}`,
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

export async function fetchSellerWarehouses(
  token: string
): Promise<readonly SellerWarehouse[]> {
  const response = await apiRequest<SellerWarehouseListEnvelope>(
    "/api/v1/seller/warehouses",
    { token }
  );
  return response.data;
}

export async function fetchSellerInventory(
  token: string
): Promise<readonly SellerInventoryPosition[]> {
  const response = await apiRequest<SellerInventoryListEnvelope>(
    "/api/v1/seller/inventory",
    { token }
  );
  return response.data;
}

export async function fetchSellerOrders(
  token: string
): Promise<readonly SellerOrderSummary[]> {
  const response = await apiRequest<SellerOrderListEnvelope>(
    "/api/v1/seller/orders",
    { token }
  );
  return response.data;
}

export async function fetchSellerOrder(
  token: string,
  orderId: string
): Promise<SellerOrderDetail | null> {
  try {
    const response = await apiRequest<SellerOrderEnvelope>(
      `/api/v1/seller/orders/${encodeURIComponent(orderId)}`,
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
