import { PageSkeleton } from "@/components/ui/skeletons";

export default function LoginLoading() {
  return (
    <section className="section-tight">
      <div className="container">
        <PageSkeleton label="Cargando ingreso" rows={3} />
      </div>
    </section>
  );
}
