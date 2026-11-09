"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { type ActionState, toActionError } from "@/lib/action-state";
import { getSessionToken } from "@/features/auth/session";
import type { CartEnvelope } from "./types";

function requireTokenMessage(): ActionState {
  return {
    status: "error",
    message: "Inicia sesión como comprador para usar el carrito."
  };
}

export async function addToCartAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  const productoId = String(formData.get("productoId") ?? "");
  const cantidad = Number(formData.get("cantidad") ?? 1);

  try {
    await apiRequest<CartEnvelope>("/api/v1/cart/items", {
      method: "POST",
      token,
      body: { productoId, cantidad }
    });
    revalidatePath("/cart");
    revalidatePath(`/products/${productoId}`);
    return { status: "success", message: "Producto agregado al carrito." };
  } catch (error) {
    return toActionError(error, "No pudimos agregar el producto al carrito.");
  }
}

export async function updateCartItemAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  const productoId = String(formData.get("productoId") ?? "");
  const cantidad = Number(formData.get("cantidad") ?? 1);

  try {
    await apiRequest<CartEnvelope>(
      `/api/v1/cart/items/${encodeURIComponent(productoId)}`,
      {
        method: "PATCH",
        token,
        body: { cantidad }
      }
    );
    revalidatePath("/cart");
    return { status: "success", message: "Cantidad actualizada." };
  } catch (error) {
    return toActionError(error, "No pudimos actualizar la cantidad.");
  }
}

export async function removeCartItemAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  const productoId = String(formData.get("productoId") ?? "");

  try {
    await apiRequest<CartEnvelope>(
      `/api/v1/cart/items/${encodeURIComponent(productoId)}`,
      { method: "DELETE", token }
    );
    revalidatePath("/cart");
    return { status: "success", message: "Producto eliminado del carrito." };
  } catch (error) {
    return toActionError(error, "No pudimos eliminar el producto.");
  }
}
