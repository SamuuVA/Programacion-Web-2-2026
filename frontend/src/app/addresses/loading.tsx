import { PageSkeleton } from "@/components/ui/skeletons";

export default function AddressesLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando direcciones" rows={4} />
      </div>
    </section>
  );
}
