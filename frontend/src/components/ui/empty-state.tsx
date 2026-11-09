import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="state">
      {icon ? <span className="state-icon">{icon}</span> : null}
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <Link className="btn btn-primary" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
