export function ProductCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-media" />
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando catálogo">
      <div className="skeleton skeleton-line" style={{ height: 92 }} />
      <div className="results-bar" aria-hidden="true">
        <div className="skeleton skeleton-line short" />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-layout" aria-busy="true" aria-label="Cargando producto">
      <div className="skeleton" style={{ aspectRatio: "4 / 3.4", borderRadius: 24 }} />
      <div style={{ display: "grid", gap: 14 }}>
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" style={{ height: 38 }} />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}

export function PageSkeleton({
  label = "Cargando información",
  rows = 4
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label={label}>
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line" style={{ height: 40 }} />
      <div className="skeleton skeleton-line short" />
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="skeleton skeleton-line"
          key={index}
          style={{ height: index === rows - 1 ? 64 : 22 }}
        />
      ))}
    </div>
  );
}

