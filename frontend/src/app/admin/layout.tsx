import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/session";
import { AdminNav } from "@/features/admin/components/admin-nav";

export const metadata: Metadata = {
  title: {
    default: "Administración",
    template: "%s · Administración · NexusMarket"
  }
};

export default async function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin("/admin");

  return (
    <div className="seller-shell">
      <div className="container">
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
