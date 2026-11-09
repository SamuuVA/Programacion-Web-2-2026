"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { type ActionState, toActionError } from "@/lib/action-state";
import { getSessionToken } from "@/features/auth/session";
import type {
  DeliveryEnvelope,
  DispatchShipmentEnvelope,
  PrepareShipmentEnvelope
} from "./types";

const SIN_SESION =
  "Inicia sesión como operador logístico para ejecutar operaciones.";

function sinSesion(): ActionState {
  return { status: "error", message: SIN_SESION };
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function optional(formData: FormData, name: string): string | undefined {
  const value = text(formData, name);
  return value.length > 0 ? value : undefined;
}

function idempotencyKey(formData: FormData): string {
  const value = text(formData, "idempotencyKey");
  return value.length > 0 ? value : crypto.randomUUID();
}

function revalidateLogistics(orderId?: string): void {
  revalidatePath("/logistics");
  revalidatePath("/logistics/orders");
  revalidatePath("/logistics/warehouses");
  revalidatePath("/logistics/inventory");
  if (orderId) {
    revalidatePath(`/logistics/orders/${orderId}`);
  }
}

export async function prepareShipmentAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const orderId = text(formData, "orderId");
  const bodegaId = text(formData, "bodegaId");
  if (!orderId || !bodegaId) {
    return { status: "error", message: "Selecciona una bodega para preparar el envío." };
  }

  try {
    const transportista = optional(formData, "transportista");
    const response = await apiRequest<PrepareShipmentEnvelope>(
      `/api/v1/logistics/orders/${encodeURIComponent(orderId)}/prepare`,
      {
        method: "POST",
        token,
        body: {
          bodegaId,
          ...(transportista ? { transportista } : {}),
          idempotencyKey: idempotencyKey(formData)
        }
      }
    );
    revalidateLogistics(orderId);
    return {
      status: "success",
      message: response.data.duplicado
        ? "La preparación ya estaba registrada; no se creó un envío nuevo."
        : `Envío preparado desde ${response.data.envio.bodegaNombre}.`
    };
  } catch (error) {
    return toActionError(error, "No pudimos preparar el envío.");
  }
}

export async function dispatchShipmentAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const shipmentId = text(formData, "shipmentId");
  if (!shipmentId) {
    return { status: "error", message: "El envío no es válido." };
  }

  try {
    const transportista = optional(formData, "transportista");
    const trackingNumber = optional(formData, "trackingNumber");
    const response = await apiRequest<DispatchShipmentEnvelope>(
      `/api/v1/logistics/shipments/${encodeURIComponent(shipmentId)}/dispatch`,
      {
        method: "POST",
        token,
        body: {
          ...(transportista ? { transportista } : {}),
          ...(trackingNumber ? { trackingNumber } : {}),
          idempotencyKey: idempotencyKey(formData)
        }
      }
    );
    revalidateLogistics(response.data.pedido.id);
    return {
      status: "success",
      message: response.data.duplicado
        ? "El despacho ya estaba registrado; no se descontó inventario de nuevo."
        : "Envío despachado. Las reservas se consumieron y el inventario se actualizó."
    };
  } catch (error) {
    return toActionError(error, "No pudimos despachar el envío.");
  }
}

export async function deliverShipmentAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = await getSessionToken();
  if (!token) {
    return sinSesion();
  }

  const shipmentId = text(formData, "shipmentId");
  const resultado = text(formData, "resultado");
  if (!shipmentId) {
    return { status: "error", message: "El envío no es válido." };
  }
  if (resultado !== "ENTREGADO" && resultado !== "FALLIDO") {
    return { status: "error", message: "Selecciona un resultado de entrega válido." };
  }

  try {
    const tipo = optional(formData, "tipo");
    const referencia = optional(formData, "referencia");
    const nota = optional(formData, "nota");
    const motivo = optional(formData, "motivo");
    const response = await apiRequest<DeliveryEnvelope>(
      `/api/v1/logistics/shipments/${encodeURIComponent(shipmentId)}/delivery`,
      {
        method: "POST",
        token,
        body: {
          resultado,
          evidencia: {
            ...(tipo ? { tipo } : {}),
            ...(referencia ? { referencia } : {}),
            ...(nota ? { nota } : {}),
            ...(motivo ? { motivo } : {})
          },
          idempotencyKey: idempotencyKey(formData)
        }
      }
    );
    revalidateLogistics(response.data.pedido.id);
    return {
      status: "success",
      message: response.data.duplicado
        ? "La entrega ya estaba registrada; no se modificó el pedido."
        : resultado === "ENTREGADO"
          ? "Entrega registrada con evidencia."
          : "Fallo de entrega registrado con evidencia."
    };
  } catch (error) {
    return toActionError(error, "No pudimos registrar la entrega.");
  }
}
