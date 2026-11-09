import { PageSkeleton } from "@/components/ui/skeletons";

export default function AdminSellersLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando administración de vendedores" rows={5} />
      </div>
    </section>
  );
}
