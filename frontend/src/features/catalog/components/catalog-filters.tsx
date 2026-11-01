import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { CATEGORIA_LABEL, ORDEN_LABEL } from "../format";
import {
  CATEGORIAS,
  ORDENES_CATALOGO,
  type CategoriaProducto,
  type OrdenCatalogo
} from "../types";

export function CatalogFilters({
  search,
  categoria,
  orden
}: {
  search: string;
  categoria: CategoriaProducto | undefined;
  orden: OrdenCatalogo;
}) {
  const chipHref = (target: CategoriaProducto | undefined): string => {
    const params = new URLSearchParams();
    if (search) {
      params.set("search", search);
    }
    if (target) {
      params.set("categoria", target);
    }
    if (orden !== "recientes") {
      params.set("orden", orden);
    }
    const suffix = params.toString();
    return suffix ? `/products?${suffix}` : "/products";
  };

  return (
    <div className="filters">
      <form className="filters-row" action="/products" method="get" role="search">
        <div className="search-field">
          <label className="sr-only" htmlFor="catalog-search">
            Buscar productos por nombre o descripción
          </label>
          <input
            id="catalog-search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Buscar por nombre o descripción"
            autoComplete="off"
          />
        </div>

        {categoria ? (
          <input type="hidden" name="categoria" value={categoria} />
        ) : null}

        <label className="select-field">
          Ordenar por
          <select name="orden" defaultValue={orden}>
            {ORDENES_CATALOGO.map((value) => (
              <option key={value} value={value}>
                {ORDEN_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <button className="btn btn-primary" type="submit">
          <SearchIcon />
          Aplicar filtros
        </button>
      </form>

      <div className="chip-row" role="group" aria-label="Filtrar por categoría">
        <Link
          className={`chip${categoria === undefined ? " chip-active" : ""}`}
          href={chipHref(undefined)}
          aria-current={categoria === undefined ? "true" : undefined}
        >
          Todas
        </Link>
        {CATEGORIAS.map((value) => (
          <Link
            key={value}
            className={`chip${categoria === value ? " chip-active" : ""}`}
            href={chipHref(value)}
            aria-current={categoria === value ? "true" : undefined}
          >
            {CATEGORIA_LABEL[value]}
          </Link>
        ))}
      </div>
    </div>
  );
}
