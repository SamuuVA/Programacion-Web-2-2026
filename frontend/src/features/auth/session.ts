import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { AuthenticatedUser, SessionEnvelope } from "./types";

export const SESSION_COOKIE = "nexus_session";

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Resuelve la sesión contra el backend. La cookie del frontend solo guarda el
 * token opaco; la autoridad de vigencia, rol y estado sigue siendo la API.
 */
export async function getSession(): Promise<AuthenticatedUser | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest<SessionEnvelope>("/api/v1/auth/session", {
      token
    });
    return response.data.usuario;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    return null;
  }
}

export async function requireBuyer(
  redirectTo: string
): Promise<AuthenticatedUser & { compradorId: string }> {
  const user = await getSession();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (user.rol !== "COMPRADOR" || !user.compradorId) {
    redirect("/");
  }
  return user as AuthenticatedUser & { compradorId: string };
}

export async function requireAdmin(redirectTo: string): Promise<AuthenticatedUser> {
  const user = await getSession();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (user.rol !== "ADMINISTRADOR" || user.estado !== "ACTIVO") {
    redirect("/");
  }
  return user;
}

export function safeRedirect(value: string): string {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}
