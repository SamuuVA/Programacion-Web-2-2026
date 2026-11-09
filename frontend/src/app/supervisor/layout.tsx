import type { Metadata } from "next";
import { requireSupervisor } from "@/features/auth/session";
import { SupervisorNav } from "@/features/supervisor/components/supervisor-nav";

export const metadata: Metadata = {
  title: {
    default: "Supervisión",
    template: "%s · Supervisión · NexusMarket"
  }
};

export default async function SupervisorLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireSupervisor("/supervisor");

  return (
    <div className="seller-shell">
      <div className="container">
        <SupervisorNav />
      </div>
      {children}
    </div>
  );
}
