import "server-only";
import { apiRequest } from "@/lib/api/client";
import type { Address, AddressListEnvelope } from "./types";

export async function fetchAddresses(token: string): Promise<readonly Address[]> {
  const response = await apiRequest<AddressListEnvelope>(
    "/api/v1/buyers/me/addresses",
    { token }
  );
  return response.data;
}
