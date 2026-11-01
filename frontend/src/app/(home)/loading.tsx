import { ProductGridSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="container section" aria-busy="true" aria-label="Cargando NexusMarket">
      <div className="skeleton skeleton-line short" />
      <div
        className="skeleton"
        style={{ height: 240, margin: "18px 0 32px", borderRadius: 24 }}
      />
      <ProductGridSkeleton count={4} />
    </div>
  );
}
