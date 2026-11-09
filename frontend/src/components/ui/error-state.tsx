import type { ReactNode } from "react";
import { AlertTriangleIcon } from "@/components/icons";

export function ErrorState({
  title = "No pudimos cargar esta información",
  description,
  correlationId,
  children
}: {
  title?: string;
  description: string;
  correlationId?: string;
  children?: ReactNode;
}) {
  return (
    <div className="state state-error" role="alert">
      <span className="state-icon">
        <AlertTriangleIcon width={24} height={24} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {correlationId ? (
        <p className="state-correlation">Código de seguimiento: {correlationId}</p>
      ) : null}
      {children}
    </div>
  );
}
