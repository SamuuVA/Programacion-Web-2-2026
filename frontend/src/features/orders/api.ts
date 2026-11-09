import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  OrderDetail,
  OrderEnvelope,
  OrderListEnvelope,
  OrderSummary
} from "./types";

export async function fetchOrders(token: string): Promise<readonly OrderSummary[]> {
  const response = await apiRequest<OrderListEnvelope>("/api/v1/orders", { token });
  return response.data;
}

export async function fetchOrder(
  token: string,
  orderId: string
): Promise<OrderDetail | null> {
  try {
    const response = await apiRequest<OrderEnvelope>(
      `/api/v1/orders/${encodeURIComponent(orderId)}`,
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
