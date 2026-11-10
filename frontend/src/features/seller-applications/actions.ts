"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { toActionError } from "@/lib/action-state";
import { getSession, getSessionToken } from "@/features/auth/session";
import type {
  AccionEstadoUsuario,
  ApproveSellerApplicationEnvelope,
  SellerApplicationDetail,
  SellerApplicationEnvelope,
  UserAccessTransitionEnvelope,
  UserAccessTransitionResult
} from "./types";

export interface SubmitSellerApplicationState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
  readonly solicitud?: SellerApplicationDetail;
}

export interface ApproveSellerApplicationState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
  readonly result?: ApproveSellerApplicationEnvelope["data"];
}

export interface RejectSellerApplicationState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
}

export interface UpdateUserAccessStatusState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
  readonly result?: UserAccessTransitionResult;
}

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? "").trim();
}

/**
 * El comprador autenticado presenta su solicitud. La autorización real la
 * vuelve a aplicar el backend; aquí solo se evita invocar la API sin sesión.
 */
export async function submitSellerApplicationAction(
  _previous: SubmitSellerApplicationState,
  formData: FormData
): Promise<SubmitSellerApplicationState> {
  const session = await getSession();
  if (!session || session.rol !== "COMPRADOR" || session.compradorId === null) {
    return {
      status: "error",
      message: "Inicia sesión como comprador activo para presentar la solicitud."
    };
  }
  const token = await getSessionToken();
  if (!token) {
    return {
      status: "error",
      message: "Inicia sesión como comprador activo para presentar la solicitud."
    };
  }

  const payload = {
    nombreComercial: text(formData, "nombreComercial"),
    nombreBodega: text(formData, "nombreBodega"),
    ubicacionBodega: text(formData, "ubicacionBodega")
  };

  if (!payload.nombreComercial || !payload.nombreBodega || !payload.ubicacionBodega) {
    return {
      status: "error",
      message: "Completa el nombre comercial, la bodega y su ubicación."
    };
  }

  try {
    const response = await apiRequest<SellerApplicationEnvelope>(
      "/api/v1/buyer/seller-application",
      { method: "POST", token, body: payload }
    );
    revalidatePath("/seller-application");
    return {
      status: "success",
      message: "Solicitud enviada. Queda pendiente de revisión administrativa.",
      solicitud: response.data
    };
  } catch (error) {
    return toActionError(error, "No pudimos enviar la solicitud.");
  }
}

/**
 * Aprobación administrativa. La transacción atómica de vendedor + primera
 * bodega vive en PostgreSQL; el frontend solo refleja el resultado.
 */
export async function approveSellerApplicationAction(
  _previous: ApproveSellerApplicationState,
  formData: FormData
): Promise<ApproveSellerApplicationState> {
  const session = await getSession();
  if (!session || session.rol !== "ADMINISTRADOR" || session.estado !== "ACTIVO") {
    return {
      status: "error",
      message: "Solo un administrador activo puede aprobar solicitudes."
    };
  }
  const token = await getSessionToken();
  if (!token) {
    return {
      status: "error",
      message: "Solo un administrador activo puede aprobar solicitudes."
    };
  }

  const applicationId = text(formData, "applicationId");
  if (!applicationId) {
    return { status: "error", message: "La solicitud no es válida." };
  }

  try {
    const response = await apiRequest<ApproveSellerApplicationEnvelope>(
      `/api/v1/admin/seller-applications/${encodeURIComponent(applicationId)}/approve`,
      { method: "POST", token }
    );
    revalidatePath("/admin/seller-applications");
    revalidatePath(`/admin/seller-applications/${applicationId}`);
    revalidatePath("/admin/users");
    return {
      status: "success",
      message: response.data.yaAprobada
        ? "La solicitud ya estaba aprobada. Se conservan el vendedor y la bodega existentes."
        : "Solicitud aprobada. Se creó el vendedor y su primera bodega.",
      result: response.data
    };
  } catch (error) {
    return toActionError(error, "No pudimos aprobar la solicitud.");
  }
}

export async function rejectSellerApplicationAction(
  _previous: RejectSellerApplicationState,
  formData: FormData
): Promise<RejectSellerApplicationState> {
  const session = await getSession();
  if (!session || session.rol !== "ADMINISTRADOR" || session.estado !== "ACTIVO") {
    return {
      status: "error",
      message: "Solo un administrador activo puede rechazar solicitudes."
    };
  }
  const token = await getSessionToken();
  if (!token) {
    return {
      status: "error",
      message: "Solo un administrador activo puede rechazar solicitudes."
    };
  }

  const applicationId = text(formData, "applicationId");
  const motivo = text(formData, "motivo");
  if (!applicationId) {
    return { status: "error", message: "La solicitud no es válida." };
  }
  if (motivo.length < 3) {
    return {
      status: "error",
      message: "Indica un motivo de rechazo de al menos 3 caracteres."
    };
  }

  try {
    await apiRequest<SellerApplicationEnvelope>(
      `/api/v1/admin/seller-applications/${encodeURIComponent(applicationId)}/reject`,
      { method: "POST", token, body: { motivo } }
    );
    revalidatePath("/admin/seller-applications");
    revalidatePath(`/admin/seller-applications/${applicationId}`);
    return {
      status: "success",
      message:
        "Solicitud rechazada. No se creó vendedor ni bodega y el acceso del comprador no cambió."
    };
  } catch (error) {
    return toActionError(error, "No pudimos rechazar la solicitud.");
  }
}

/**
 * Cambio del estado de acceso. Las transiciones válidas, el motivo obligatorio
 * y la prohibición de autogestión se validan en el backend.
 */
export async function updateUserAccessStatusAction(
  _previous: UpdateUserAccessStatusState,
  formData: FormData
): Promise<UpdateUserAccessStatusState> {
  const session = await getSession();
  if (!session || session.rol !== "ADMINISTRADOR" || session.estado !== "ACTIVO") {
    return {
      status: "error",
      message: "Solo un administrador activo puede cambiar estados de acceso."
    };
  }
  const token = await getSessionToken();
  if (!token) {
    return {
      status: "error",
      message: "Solo un administrador activo puede cambiar estados de acceso."
    };
  }

  const usuarioId = text(formData, "usuarioId");
  const accion = text(formData, "accion") as AccionEstadoUsuario;
  const motivo = text(formData, "motivo");

  if (!usuarioId) {
    return { status: "error", message: "La cuenta no es válida." };
  }
  if (
    accion !== "ACTIVAR" &&
    accion !== "DESACTIVAR" &&
    accion !== "BLOQUEAR" &&
    accion !== "DESBLOQUEAR"
  ) {
    return { status: "error", message: "Selecciona una acción válida." };
  }
  if ((accion === "DESACTIVAR" || accion === "BLOQUEAR") && motivo.length === 0) {
    return {
      status: "error",
      message: "El motivo es obligatorio para desactivar o bloquear una cuenta."
    };
  }

  try {
    const response = await apiRequest<UserAccessTransitionEnvelope>(
      `/api/v1/admin/users/${encodeURIComponent(usuarioId)}/access-status`,
      {
        method: "PATCH",
        token,
        body: { accion, ...(motivo.length > 0 ? { motivo } : {}) }
      }
    );
    revalidatePath(`/admin/users/${usuarioId}`);
    revalidatePath("/admin/users");
    return {
      status: "success",
      message: `Estado actualizado de ${response.data.estadoAnterior} a ${response.data.estadoNuevo}.`,
      result: response.data
    };
  } catch (error) {
    return toActionError(error, "No pudimos cambiar el estado de acceso.");
  }
}
