import { ApiError } from "@/lib/api/errors";

export interface ActionState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly correlationId?: string;
  readonly details?: Record<string, unknown>;
}

export const IDLE_ACTION_STATE: ActionState = { status: "idle" };

export function toActionError(error: unknown, fallback: string): ActionState {
  if (error instanceof ApiError) {
    return {
      status: "error",
      message: error.message || fallback,
      ...(error.correlationId !== undefined
        ? { correlationId: error.correlationId }
        : {}),
      ...(error.details !== undefined ? { details: error.details } : {})
    };
  }
  return { status: "error", message: fallback };
}
