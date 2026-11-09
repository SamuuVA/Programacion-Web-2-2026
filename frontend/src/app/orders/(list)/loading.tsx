import { PageSkeleton } from "@/components/ui/skeletons";

export default function OrdersLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando pedidos" rows={4} />
      </div>
    </section>
  );
}
