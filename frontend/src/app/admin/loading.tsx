import { PageSkeleton } from "@/components/ui/skeletons";

export default function AdminLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando la información administrativa" rows={5} />
      </div>
    </section>
  );
}
