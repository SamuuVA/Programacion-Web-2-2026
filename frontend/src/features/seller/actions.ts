"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { type ActionState, toActionError } from "@/lib/action-state";
import { getSessionToken } from "@/features/auth/session";
import { centavosDesdeTexto } from "./format";
import type {
  SellerIngressEnvelope,
  SellerProductEnvelope,
  SellerWarehouseEnvelope
} from "./types";

const SIN_SESION =
  "Inicia sesión como vendedor para administrar tu espacio de trabajo.";

function sinSesion(): ActionState {
  return { status: "error", message: SIN_SESION };
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function revalidateSeller(productId?: string): void {
  revalidatePath("/seller");
  revalidatePath("/seller/products");
  revalidatePath("/seller/inventory");
  revalidatePath("/seller/orders");
  if (productId) {
    revalidatePath(`/seller/products/${productId}`);
  }
}

export async function updateSellerProfileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  try {
    await apiRequest("/api/v1/seller/profile", {
      method: "PATCH",
      token,
      body: { nombreComercial: text(formData, "nombreComercial") }
    });
    revalidatePath("/seller");
    revalidatePath("/seller/profile");
    return { status: "success", message: "Nombre comercial actualizado." };
  } catch (error) {
    return toActionError(error, "No pudimos actualizar el perfil.");
  }
}

function readProduct(formData: FormData) {
  return {
    nombre: text(formData, "nombre"),
    descripcion: text(formData, "descripcion"),
    categoria: text(formData, "categoria"),
    tipoEntrega: text(formData, "tipoEntrega"),
    sku: text(formData, "sku"),
    precioCentavos: centavosDesdeTexto(text(formData, "precio")),
    moneda: text(formData, "moneda").toUpperCase() || "COP"
  };
}

export async function createSellerProductAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  let productId: string;
  try {
    const response = await apiRequest<SellerProductEnvelope>(
      "/api/v1/seller/products",
      { method: "POST", token, body: readProduct(formData) }
    );
    productId = response.data.id;
  } catch (error) {
    return toActionError(error, "No pudimos crear el producto.");
  }

  revalidateSeller(productId);
  redirect(`/seller/products/${productId}`);
}

export async function updateSellerProductAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const productId = text(formData, "productId");
  try {
    await apiRequest<SellerProductEnvelope>(
      `/api/v1/seller/products/${encodeURIComponent(productId)}`,
      { method: "PATCH", token, body: readProduct(formData) }
    );
    revalidateSeller(productId);
    return { status: "success", message: "Producto actualizado." };
  } catch (error) {
    return toActionError(error, "No pudimos actualizar el producto.");
  }
}

export async function addSellerImageAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const productId = text(formData, "productId");
  const alt = text(formData, "alt");
  try {
    await apiRequest<SellerProductEnvelope>(
      `/api/v1/seller/products/${encodeURIComponent(productId)}/images`,
      {
        method: "POST",
        token,
        body: {
          url: text(formData, "url"),
          ...(alt.length > 0 ? { alt } : {})
        }
      }
    );
    revalidateSeller(productId);
    return { status: "success", message: "Imagen agregada." };
  } catch (error) {
    return toActionError(error, "No pudimos agregar la imagen.");
  }
}

export async function removeSellerImageAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const productId = text(formData, "productId");
  const imageId = text(formData, "imageId");
  try {
    await apiRequest<SellerProductEnvelope>(
      `/api/v1/seller/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
      { method: "DELETE", token }
    );
    revalidateSeller(productId);
    return { status: "success", message: "Imagen eliminada." };
  } catch (error) {
    return toActionError(error, "No pudimos eliminar la imagen.");
  }
}

export async function changeSellerProductStateAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const productId = text(formData, "productId");
  const action = text(formData, "accion");
  const allowed = new Set(["publish", "suspend", "discontinue"]);
  if (!allowed.has(action)) {
    return { status: "error", message: "La acción solicitada no es válida." };
  }

  try {
    await apiRequest<SellerProductEnvelope>(
      `/api/v1/seller/products/${encodeURIComponent(productId)}/${action}`,
      { method: "POST", token }
    );
    revalidateSeller(productId);
    const label =
      action === "publish"
        ? "Producto publicado."
        : action === "suspend"
          ? "Producto suspendido."
          : "Producto descontinuado.";
    return { status: "success", message: label };
  } catch (error) {
    return toActionError(error, "No pudimos cambiar el estado del producto.");
  }
}

export async function createSellerWarehouseAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  try {
    await apiRequest<SellerWarehouseEnvelope>("/api/v1/seller/warehouses", {
      method: "POST",
      token,
      body: {
        nombre: text(formData, "nombre"),
        ubicacion: text(formData, "ubicacion")
      }
    });
    revalidatePath("/seller");
    revalidatePath("/seller/warehouses");
    revalidatePath("/seller/inventory");
    return { status: "success", message: "Bodega creada." };
  } catch (error) {
    return toActionError(error, "No pudimos crear la bodega.");
  }
}

export async function updateSellerWarehouseAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const warehouseId = text(formData, "warehouseId");
  try {
    await apiRequest<SellerWarehouseEnvelope>(
      `/api/v1/seller/warehouses/${encodeURIComponent(warehouseId)}`,
      {
        method: "PATCH",
        token,
        body: {
          nombre: text(formData, "nombre"),
          ubicacion: text(formData, "ubicacion")
        }
      }
    );
    revalidatePath("/seller");
    revalidatePath("/seller/warehouses");
    revalidatePath("/seller/inventory");
    return { status: "success", message: "Bodega actualizada." };
  } catch (error) {
    return toActionError(error, "No pudimos actualizar la bodega.");
  }
}

export async function registerSellerIngressAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const productId = text(formData, "productoId");
  const cantidad = Number(text(formData, "cantidad"));
  const motivo = text(formData, "motivo");
  try {
    const response = await apiRequest<SellerIngressEnvelope>(
      "/api/v1/seller/inventory/ingresos",
      {
        method: "POST",
        token,
        body: {
          productoId: productId,
          bodegaId: text(formData, "bodegaId"),
          cantidad: Number.isInteger(cantidad) ? cantidad : 0,
          idempotencyKey: text(formData, "idempotencyKey"),
          ...(motivo.length > 0 ? { motivo } : {})
        }
      }
    );
    revalidateSeller(productId);
    return {
      status: "success",
      message: response.data.duplicado
        ? "Este ingreso ya estaba registrado; el stock no se sumó de nuevo."
        : `Ingreso registrado. Stock disponible: ${response.data.posicion.disponible}.`
    };
  } catch (error) {
    return toActionError(error, "No pudimos registrar el ingreso de inventario.");
  }
}
