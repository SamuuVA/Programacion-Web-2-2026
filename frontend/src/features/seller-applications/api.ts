import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  SellerApplicationDetail,
  SellerApplicationOwnEnvelope,
  SellerApplicationPage,
  SellerApplicationPageEnvelope
} from "./types";

function queryString(
  params: Readonly<Record<string, string | number | undefined>>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function fetchOwnSellerApplication(
  token: string
): Promise<SellerApplicationDetail | null> {
  const response = await apiRequest<SellerApplicationOwnEnvelope>(
    "/api/v1/buyer/seller-application",
    { token }
  );
  return response.data.solicitud;
}

export async function fetchAdminSellerApplications(
  token: string,
  params: {
    estado?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<SellerApplicationPage> {
  const response = await apiRequest<SellerApplicationPageEnvelope>(
    `/api/v1/admin/seller-applications${queryString(params)}`,
    { token }
  );
  return response.data;
}

export async function fetchAdminSellerApplication(
  token: string,
  applicationId: string
): Promise<SellerApplicationDetail | null> {
  try {
    const response = await apiRequest<{ data: SellerApplicationDetail }>(
      `/api/v1/admin/seller-applications/${encodeURIComponent(applicationId)}`,
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
