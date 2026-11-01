import type {
  CatalogFilters,
  CatalogPage,
  CatalogQueryRepository,
  ProductDetail,
  ProductSummary
} from "../../src/modules/catalog/application/ports.js";

const SELLER = {
  id: "11111111-1111-4111-8111-111111111111",
  nombreComercial: "Estudio Aurora"
};

function image(id: string, url: string, alt: string, orden = 0) {
  return { id, url, alt, orden };
}

function summary(
  id: string,
  nombre: string,
  descripcion: string,
  categoria: ProductSummary["categoria"],
  montoCentavos: number,
  disponible: number | null,
  creadoEn: string
): ProductSummary {
  return {
    id,
    nombre,
    descripcion,
    categoria,
    tipoEntrega: categoria === "DIGITAL" ? "DIGITAL" : "FISICA",
    precio: { montoCentavos, moneda: "COP" },
    imagenPrincipal: image(
      `${id}-img-1`,
      `/products/${id}.svg`,
      `Imagen de ${nombre}`
    ),
    disponible,
    vendedor: SELLER,
    creadoEn
  };
}

/**
 * Doble de prueba del puerto de lectura. Vive solo en `tests/`; la aplicación
 * en ejecución usa PostgreSQL.
 */
export class FakeCatalogQueryRepository implements CatalogQueryRepository {
  constructor(private readonly products: readonly ProductDetail[] = sampleProducts()) {}

  async searchPublic(filters: CatalogFilters): Promise<CatalogPage> {
    let items = [...this.products];

    if (filters.categoria !== undefined) {
      items = items.filter((item) => item.categoria === filters.categoria);
    }
    if (filters.search !== undefined) {
      const term = filters.search.toLocaleLowerCase("es");
      items = items.filter(
        (item) =>
          item.nombre.toLocaleLowerCase("es").includes(term) ||
          item.descripcion.toLocaleLowerCase("es").includes(term)
      );
    }

    items.sort((left, right) => {
      switch (filters.orden) {
        case "precio_asc":
          return left.precio.montoCentavos - right.precio.montoCentavos;
        case "precio_desc":
          return right.precio.montoCentavos - left.precio.montoCentavos;
        case "nombre_asc":
          return left.nombre.localeCompare(right.nombre, "es");
        case "recientes":
        default:
          return right.creadoEn.localeCompare(left.creadoEn);
      }
    });

    const total = items.length;
    const start = (filters.page - 1) * filters.pageSize;
    return {
      items: items.slice(start, start + filters.pageSize).map(toSummary),
      total
    };
  }

  async findPublicById(productoId: string): Promise<ProductDetail | null> {
    return this.products.find((product) => product.id === productoId) ?? null;
  }

  async close(): Promise<void> {
    // Sin recursos externos.
  }
}

function toSummary(product: ProductDetail): ProductSummary {
  const { sku: _sku, imagenes: _imagenes, actualizadoEn: _actualizadoEn, ...summary } =
    product;
  return summary;
}

export function sampleProducts(): ProductDetail[] {
  const base = summary(
    "22222222-2222-4222-8222-222222222222",
    "Audífonos Aurora",
    "Audífonos inalámbricos con cancelación de ruido y estuche de viaje.",
    "ELECTRONICA",
    42990000,
    18,
    "2026-10-30T10:00:00.000Z"
  );
  return [
    {
      ...base,
      sku: "AUR-AUD-001",
      imagenes: [
        image(`${base.id}-img-1`, `/products/${base.id}.svg`, "Vista frontal"),
        image(`${base.id}-img-2`, `/products/${base.id}-2.svg`, "Estuche", 1)
      ],
      actualizadoEn: base.creadoEn
    },
    {
      ...summary(
        "33333333-3333-4333-8333-333333333333",
        "Lámpara Nido",
        "Lámpara de mesa con luz cálida regulable y base de madera.",
        "HOGAR",
        18990000,
        7,
        "2026-10-29T10:00:00.000Z"
      ),
      sku: "NID-LAM-001",
      imagenes: [
        image(
          "33333333-3333-4333-8333-333333333333-img-1",
          "/products/33333333-3333-4333-8333-333333333333.svg",
          "Lámpara encendida"
        )
      ],
      actualizadoEn: "2026-10-29T10:00:00.000Z"
    },
    {
      ...summary(
        "44444444-4444-4444-8444-444444444444",
        "Guía de fotografía urbana",
        "Curso digital descargable con ejercicios y recursos editables.",
        "DIGITAL",
        9900000,
        null,
        "2026-10-28T10:00:00.000Z"
      ),
      sku: "DIG-FOT-001",
      imagenes: [
        image(
          "44444444-4444-4444-8444-444444444444-img-1",
          "/products/44444444-4444-4444-8444-444444444444.svg",
          "Portada del curso"
        )
      ],
      actualizadoEn: "2026-10-28T10:00:00.000Z"
    }
  ];
}
