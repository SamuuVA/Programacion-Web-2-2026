import { ProductCard } from "./product-card";
import type { ProductoResumen } from "../types";

export function ProductGrid({
  products
}: {
  products: readonly ProductoResumen[];
}) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
