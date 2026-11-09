import { PageSkeleton } from "@/components/ui/skeletons";

export default function CartLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando carrito" rows={4} />
      </div>
    </section>
  );
}
