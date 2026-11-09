"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { toActionError } from "@/lib/action-state";
import { getSessionToken } from "@/features/auth/session";
import type { RegisterSellerEnvelope, RegisterSellerResult } from "./types";

export interface RegisterSellerState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
  readonly result?: RegisterSellerResult;
}

export async function registerSellerAction(
  _previous: RegisterSellerState,
  formData: FormData
): Promise<RegisterSellerState> {
  const token = await getSessionToken();
  if (!token) {
    return {
      status: "error",
      message: "Inicia sesión como administrador para registrar vendedores."
    };
  }

  const payload = {
    nombreCompleto: String(formData.get("nombreCompleto") ?? "").trim(),
    correoElectronico: String(formData.get("correoElectronico") ?? "").trim(),
    documentoIdentidad: {
      tipo: String(formData.get("documentoTipo") ?? "").trim(),
      pais: String(formData.get("documentoPais") ?? "").trim().toUpperCase(),
      numero: String(formData.get("documentoNumero") ?? "").trim()
    },
    credencial: String(formData.get("credencial") ?? ""),
    nombreComercial: String(formData.get("nombreComercial") ?? "").trim(),
    bodega: {
      nombre: String(formData.get("bodegaNombre") ?? "").trim(),
      ubicacion: String(formData.get("bodegaUbicacion") ?? "").trim()
    }
  };

  try {
    const response = await apiRequest<RegisterSellerEnvelope>(
      "/api/v1/admin/sellers",
      { method: "POST", token, body: payload }
    );
    revalidatePath("/admin/sellers");
    revalidatePath("/admin/sellers/new");
    revalidatePath("/admin");
    return {
      status: "success",
      message: `Vendedor ${response.data.correoNormalizado} creado con su primera bodega.`,
      result: response.data
    };
  } catch (error) {
    const state = toActionError(error, "No pudimos registrar al vendedor.");
    return {
      status: "error",
      ...(state.message !== undefined ? { message: state.message } : {}),
      ...(state.correlationId !== undefined
        ? { correlationId: state.correlationId }
        : {})
    };
  }
}
