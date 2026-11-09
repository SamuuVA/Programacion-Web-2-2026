import { PageSkeleton } from "@/components/ui/skeletons";

export default function SupervisorLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando la información de supervisión" rows={5} />
      </div>
    </section>
  );
}
