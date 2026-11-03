import { PageSkeleton } from "@/components/ui/skeletons";

export default function CheckoutLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando checkout" rows={5} />
      </div>
    </section>
  );
}
