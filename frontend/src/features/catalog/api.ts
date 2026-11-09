import "server-only";
import { cache } from "react";
import { apiGet, ApiError } from "@/lib/api/client";
import type {
  Categoria,
  CatalogQuery,
  ProductoDetalle,
  ProductosPage
} from "./types";

interface ProductsEnvelope {
  readonly data: ProductosPage;
}

interface ProductEnvelope {
  readonly data: ProductoDetalle;
}

interface CategoriesEnvelope {
  readonly data: readonly Categoria[];
}

export async function fetchProducts(
  query: CatalogQuery = {}
): Promise<ProductosPage> {
  const params = new URLSearchParams();
  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }
  if (query.categoria) {
    params.set("categoria", query.categoria);
  }
  if (query.orden) {
    params.set("orden", query.orden);
  }
  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await apiGet<ProductsEnvelope>(`/api/v1/products${suffix}`);
  return response.data;
}

export const fetchProduct = cache(async function fetchProduct(
  productoId: string
): Promise<ProductoDetalle | null> {
  try {
    const response = await apiGet<ProductEnvelope>(
      `/api/v1/products/${encodeURIComponent(productoId)}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
});

export const fetchCategories = cache(async function fetchCategories(): Promise<
  readonly Categoria[]
> {
  const response = await apiGet<CategoriesEnvelope>("/api/v1/categories");
  return response.data;
});
