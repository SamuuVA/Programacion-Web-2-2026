import { PageSkeleton } from "@/components/ui/skeletons";

export default function LogisticsLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando la operación logística" rows={5} />
      </div>
    </section>
  );
}
