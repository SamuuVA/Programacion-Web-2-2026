import { CatalogSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="skeleton skeleton-line short" />
          <div
            className="skeleton skeleton-line"
            style={{ height: 40, width: "52%", marginTop: 16 }}
          />
          <div
            className="skeleton skeleton-line"
            style={{ width: "68%", marginTop: 14 }}
          />
        </div>
      </section>
      <section className="section-tight">
        <div className="container">
          <CatalogSkeleton />
        </div>
      </section>
    </>
  );
}
