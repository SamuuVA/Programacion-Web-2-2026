"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api/client";
import { SESSION_COOKIE, getSessionToken, safeRedirect } from "./session";
import type { LoginEnvelope } from "./types";

export interface LoginState {
  readonly error?: string;
  readonly correlationId?: string;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  const correoElectronico = String(
    formData.get("correoElectronico") ?? ""
  ).trim();
  const credencial = String(formData.get("credencial") ?? "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") ?? "/"));

  if (!correoElectronico || !credencial) {
    return { error: "Ingresa tu correo y tu contraseña." };
  }

  try {
    const response = await apiRequest<LoginEnvelope>("/api/v1/auth/login", {
      method: "POST",
      body: { correoElectronico, credencial }
    });

    const expiresAt = new Date(response.data.expiraEn).getTime();
    const maxAge = Number.isNaN(expiresAt)
      ? 8 * 60 * 60
      : Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));

    const store = await cookies();
    store.set(SESSION_COOKIE, response.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.SESSION_COOKIE_SECURE === "true",
      path: "/",
      maxAge
    });

    redirect(redirectTo);
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
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    try {
      await apiRequest<void>("/api/v1/auth/logout", {
        method: "POST",
        token
      });
    } catch {
      // La cookie local se elimina aunque el backend no esté disponible.
    }
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
