import { PageSkeleton } from "@/components/ui/skeletons";

export default function SellerLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando tu espacio de vendedor" rows={5} />
      </div>
    </section>
  );
}
