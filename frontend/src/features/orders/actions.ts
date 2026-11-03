"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiRequest } from "@/lib/api/client";
import { getSessionToken } from "@/features/auth/session";
import type {
  CheckoutEnvelope,
  CheckoutResult,
  ResultadoPagoSimulado
} from "./types";

export interface CheckoutState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
  readonly result?: CheckoutResult;
  readonly motivo?: string;
  readonly cambios?: readonly Record<string, unknown>[];
}

export async function checkoutAction(
  _previous: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const token = await getSessionToken();
  if (!token) {
    return {
      status: "error",
      message: "Inicia sesión como comprador para completar la compra."
    };
  }

  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const direccionEntregaId =
    String(formData.get("direccionEntregaId") ?? "").trim() || null;
  const resultadoPagoSimulado = String(
    formData.get("resultadoPagoSimulado") ?? "CONFIRMADO"
  ) as ResultadoPagoSimulado;
  const confirmarPrecio = formData.get("confirmarPrecio") === "true";

  if (!idempotencyKey) {
    return { status: "error", message: "No se generó una clave de compra válida." };
  }

  try {
    const response = await apiRequest<CheckoutEnvelope>("/api/v1/checkout", {
      method: "POST",
      token,
      body: {
        idempotencyKey,
        direccionEntregaId,
        confirmarPrecio,
        resultadoPagoSimulado
      }
    });

    revalidatePath("/cart");
    revalidatePath("/orders");
    for (const order of response.data.pedidos) {
      revalidatePath(`/orders/${order.id}`);
    }

    return {
      status: "success",
      result: response.data,
      message: response.data.mensaje
    };
  } catch (error) {
    if (error instanceof ApiError) {
      const motivo =
        typeof error.details?.motivo === "string" ? error.details.motivo : undefined;
      const cambios = Array.isArray(error.details?.cambios)
        ? (error.details.cambios as readonly Record<string, unknown>[])
        : undefined;
      return {
        status: "error",
        message: error.message,
        ...(error.correlationId !== undefined
          ? { correlationId: error.correlationId }
          : {}),
        ...(motivo !== undefined ? { motivo } : {}),
        ...(cambios !== undefined ? { cambios } : {})
      };
    }
    return {
      status: "error",
      message: "No pudimos completar la compra. Inténtalo de nuevo."
    };
  }
}
