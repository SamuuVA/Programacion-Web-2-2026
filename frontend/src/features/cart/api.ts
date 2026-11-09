import "server-only";
import { apiRequest } from "@/lib/api/client";
import type { CartEnvelope } from "./types";

export async function fetchCart(token: string): Promise<CartEnvelope["data"]> {
  const response = await apiRequest<CartEnvelope>("/api/v1/cart", { token });
  return response.data;
}
