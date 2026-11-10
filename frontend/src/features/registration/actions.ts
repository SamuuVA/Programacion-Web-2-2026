"use server";

import { redirect } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api/client";
import type {
  RegisterBuyerEnvelope,
  RegisterBuyerRequest
} from "./types";

export interface RegisterBuyerState {
  readonly error?: string;
  readonly correlationId?: string;
}

const DOCUMENTO_TIPOS = new Set([
  "CC",
  "CE",
  "NIT",
  "PASAPORTE",
  "TI",
  "OTRO"
]);

function readText(formData: FormData, field: string): string {
  return String(formData.get(field) ?? "").trim();
}

/**
 * Registro público de comprador.
 *
 * Es la única operación de esta fase que no exige sesión. El rol nunca se
 * envía desde el navegador: el backend asigna siempre COMPRADOR y ACTIVO.
 */
export async function registerBuyerAction(
  _previous: RegisterBuyerState,
  formData: FormData
): Promise<RegisterBuyerState> {
  const nombreCompleto = readText(formData, "nombreCompleto");
  const correoElectronico = readText(formData, "correoElectronico");
  const tipoDocumento = readText(formData, "tipoDocumento").toUpperCase();
  const paisDocumento = readText(formData, "paisDocumento").toUpperCase();
  const numeroDocumento = readText(formData, "numeroDocumento");
  const credencial = String(formData.get("credencial") ?? "");
  const confirmarCredencial = String(formData.get("confirmarCredencial") ?? "");

  if (
    !nombreCompleto ||
    !correoElectronico ||
    !tipoDocumento ||
    !paisDocumento ||
    !numeroDocumento ||
    !credencial
  ) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (!DOCUMENTO_TIPOS.has(tipoDocumento)) {
    return { error: "Selecciona un tipo de documento válido." };
  }

  if (!/^[A-Za-z]{2}$/.test(paisDocumento)) {
    return { error: "El país del documento debe tener dos letras (por ejemplo CO)." };
  }

  if ([...credencial].length < 12 || [...credencial].length > 128) {
    return {
      error: "La contraseña debe tener entre 12 y 128 caracteres."
    };
  }

  if (credencial !== confirmarCredencial) {
    return { error: "Las contraseñas no coinciden." };
  }

  const payload: RegisterBuyerRequest = {
    nombreCompleto,
    correoElectronico,
    documentoIdentidad: {
      tipo: tipoDocumento,
      pais: paisDocumento,
      numero: numeroDocumento
    },
    credencial
  };

  try {
    await apiRequest<RegisterBuyerEnvelope>("/api/v1/buyers", {
      method: "POST",
      body: payload
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error: error.message,
        ...(error.correlationId !== undefined
          ? { correlationId: error.correlationId }
          : {})
      };
    }
    throw error;
  }

  // Fuera del try: redirect lanza una excepción de control de flujo.
  redirect(`/login?registrado=1&correo=${encodeURIComponent(correoElectronico)}`);
}
