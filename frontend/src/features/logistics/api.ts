import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  DeliveryEnvelope,
  DispatchShipmentEnvelope,
  LogisticsInventoryListEnvelope,
  LogisticsInventoryPosition,
  LogisticsOrderDetail,
  LogisticsOrderEnvelope,
  LogisticsOrderListEnvelope,
  LogisticsOrderSummary,
  LogisticsProfile,
  LogisticsProfileEnvelope,
  LogisticsSummary,
  LogisticsSummaryEnvelope,
  LogisticsWarehouse,
  LogisticsWarehouseListEnvelope,
  PrepareShipmentEnvelope,
  PrepareShipmentResult,
  DispatchShipmentResult,
  DeliveryResult
} from "./types";

export async function fetchLogisticsProfile(
  token: string
): Promise<LogisticsProfile> {
  const response = await apiRequest<LogisticsProfileEnvelope>(
    "/api/v1/logistics/profile",
    { token }
  );
  return response.data;
}

export async function fetchLogisticsWarehouses(
  token: string
): Promise<readonly LogisticsWarehouse[]> {
  const response = await apiRequest<LogisticsWarehouseListEnvelope>(
    "/api/v1/logistics/warehouses",
    { token }
  );
  return response.data;
}

export async function fetchLogisticsInventory(
  token: string
): Promise<readonly LogisticsInventoryPosition[]> {
  const response = await apiRequest<LogisticsInventoryListEnvelope>(
    "/api/v1/logistics/inventory",
    { token }
  );
  return response.data;
}

export async function fetchLogisticsSummary(
  token: string
): Promise<LogisticsSummary> {
  const response = await apiRequest<LogisticsSummaryEnvelope>(
    "/api/v1/logistics/summary",
    { token }
  );
  return response.data;
}

export async function fetchLogisticsOrders(
  token: string,
  estado?: string
): Promise<readonly LogisticsOrderSummary[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const response = await apiRequest<LogisticsOrderListEnvelope>(
    `/api/v1/logistics/orders${query}`,
    { token }
  );
  return response.data;
}

export async function fetchLogisticsOrder(
  token: string,
  orderId: string
): Promise<LogisticsOrderDetail | null> {
  try {
    const response = await apiRequest<LogisticsOrderEnvelope>(
      `/api/v1/logistics/orders/${encodeURIComponent(orderId)}`,
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

export async function prepareShipment(
  token: string,
  orderId: string,
  input: {
    bodegaId: string;
    transportista?: string;
    idempotencyKey: string;
  }
): Promise<PrepareShipmentResult> {
  const response = await apiRequest<PrepareShipmentEnvelope>(
    `/api/v1/logistics/orders/${encodeURIComponent(orderId)}/prepare`,
    { method: "POST", token, body: input }
  );
  return response.data;
}

export async function dispatchShipment(
  token: string,
  shipmentId: string,
  input: {
    transportista?: string;
    trackingNumber?: string;
    idempotencyKey: string;
  }
): Promise<DispatchShipmentResult> {
  const response = await apiRequest<DispatchShipmentEnvelope>(
    `/api/v1/logistics/shipments/${encodeURIComponent(shipmentId)}/dispatch`,
    { method: "POST", token, body: input }
  );
  return response.data;
}

export async function deliverShipment(
  token: string,
  shipmentId: string,
  input: {
    resultado: "ENTREGADO" | "FALLIDO";
    evidencia: {
      tipo?: string;
      referencia?: string;
      nota?: string;
      motivo?: string;
    };
    idempotencyKey: string;
  }
): Promise<DeliveryResult> {
  const response = await apiRequest<DeliveryEnvelope>(
    `/api/v1/logistics/shipments/${encodeURIComponent(shipmentId)}/delivery`,
    { method: "POST", token, body: input }
  );
  return response.data;
}
