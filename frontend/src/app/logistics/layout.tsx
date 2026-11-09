import type { Metadata } from "next";
import { requireLogistics } from "@/features/auth/session";
import { LogisticsNav } from "@/features/logistics/components/logistics-nav";

export const metadata: Metadata = {
  title: {
    default: "Operación logística",
    template: "%s · Operación logística · NexusMarket"
  }
};

export default async function LogisticsLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireLogistics("/logistics");

  return (
    <div className="seller-shell">
      <div className="container">
        <LogisticsNav />
      </div>
      {children}
    </div>
  );
}
