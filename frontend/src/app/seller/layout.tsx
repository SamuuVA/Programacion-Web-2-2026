import type { Metadata } from "next";
import { requireSeller } from "@/features/auth/session";
import { SellerNav } from "@/features/seller/components/seller-nav";

export const metadata: Metadata = {
  title: {
    default: "Mi tienda",
    template: "%s · Mi tienda · NexusMarket"
  }
};

export default async function SellerLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await requireSeller("/seller");

  return (
    <div className="seller-shell">
      <div className="container">
        <SellerNav />
      </div>
      {children}
    </div>
  );
}
