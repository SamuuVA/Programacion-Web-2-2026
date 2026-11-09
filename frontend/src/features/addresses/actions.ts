"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { type ActionState, toActionError } from "@/lib/action-state";
import { getSessionToken } from "@/features/auth/session";
import type { AddressEnvelope } from "./types";

function requireTokenMessage(): ActionState {
  return {
    status: "error",
    message: "Inicia sesión como comprador para administrar tus direcciones."
  };
}

function readAddress(formData: FormData) {
  const linea2 = String(formData.get("linea2") ?? "").trim();
  const codigoPostal = String(formData.get("codigoPostal") ?? "").trim();
  const pais = String(formData.get("pais") ?? "").trim().toUpperCase();

  return {
    destinatario: String(formData.get("destinatario") ?? "").trim(),
    telefono: String(formData.get("telefono") ?? "").trim(),
    linea1: String(formData.get("linea1") ?? "").trim(),
    linea2: linea2.length > 0 ? linea2 : null,
    ciudad: String(formData.get("ciudad") ?? "").trim(),
    region: String(formData.get("region") ?? "").trim(),
    codigoPostal: codigoPostal.length > 0 ? codigoPostal : null,
    pais: pais.length === 2 ? pais : "CO"
  };
}

export async function createAddressAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  try {
    await apiRequest<AddressEnvelope>("/api/v1/buyers/me/addresses", {
      method: "POST",
      token,
      body: readAddress(formData)
    });
    revalidatePath("/addresses");
    revalidatePath("/checkout");
    return { status: "success", message: "Dirección guardada." };
  } catch (error) {
    return toActionError(error, "No pudimos guardar la dirección.");
  }
}

export async function updateAddressAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  const direccionId = String(formData.get("direccionId") ?? "");

  try {
    await apiRequest<AddressEnvelope>(
      `/api/v1/buyers/me/addresses/${encodeURIComponent(direccionId)}`,
      {
        method: "PATCH",
        token,
        body: readAddress(formData)
      }
    );
    revalidatePath("/addresses");
    revalidatePath("/checkout");
    return { status: "success", message: "Dirección actualizada." };
  } catch (error) {
    return toActionError(error, "No pudimos actualizar la dirección.");
  }
}

export async function deleteAddressAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  const direccionId = String(formData.get("direccionId") ?? "");

  try {
    await apiRequest<void>(
      `/api/v1/buyers/me/addresses/${encodeURIComponent(direccionId)}`,
      { method: "DELETE", token }
    );
    revalidatePath("/addresses");
    revalidatePath("/checkout");
    return { status: "success", message: "Dirección eliminada." };
  } catch (error) {
    return toActionError(error, "No pudimos eliminar la dirección.");
  }
}

export async function setPrincipalAddressAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return requireTokenMessage();
  }

  const direccionId = String(formData.get("direccionId") ?? "");

  try {
    await apiRequest<void>(
      `/api/v1/buyers/me/addresses/${encodeURIComponent(direccionId)}/principal`,
      { method: "POST", token }
    );
    revalidatePath("/addresses");
    revalidatePath("/checkout");
    return { status: "success", message: "Dirección principal actualizada." };
  } catch (error) {
    return toActionError(error, "No pudimos cambiar la dirección principal.");
  }
}
