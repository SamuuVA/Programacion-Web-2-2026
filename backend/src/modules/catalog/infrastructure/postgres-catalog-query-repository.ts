import { Pool } from "pg";
import { DependencyUnavailableError } from "../../../shared/domain/errors.js";
import type {
  CategoriaProducto,
  ImagenProducto,
  TipoEntrega
} from "../domain/producto.js";
import type {
  CatalogFilters,
  CatalogPage,
  CatalogQueryRepository,
  ProductDetail,
  ProductSummary
} from "../application/ports.js";

interface ProductRow {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  tipo_entrega: TipoEntrega;
  sku: string;
  precio_centavos: string;
  moneda: string;
  creado_en: Date;
  actualizado_en: Date;
  vendedor_id: string;
  vendedor_nombre: string;
  disponible: number | null;
  imagen_id: string | null;
  imagen_url: string | null;
  imagen_alt: string | null;
  imagen_orden: number | null;
}

interface ImageRow {
  id: string;
  url: string;
  alt: string;
  orden: number;
}

const PUBLIC_FILTER = `p.estado = 'PUBLICADO' AND s.estado = 'ACTIVO'`;

/**
 * Adaptador de lectura del catálogo público.
 *
 * Solo traduce filas a read models y aplica los filtros del contrato. No
 * decide publicación ni vendibilidad: esas reglas viven en el dominio y en
 * los casos de uso; aquí únicamente se restringe el alcance público.
 */
export class PostgresCatalogQueryRepository implements CatalogQueryRepository {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  async searchPublic(filters: CatalogFilters): Promise<CatalogPage> {
    const conditions: string[] = [PUBLIC_FILTER];
    const values: unknown[] = [];

    if (filters.search !== undefined) {
      values.push(`%${escapeLike(filters.search)}%`);
      conditions.push(
        `(${unaccentSql("p.nombre")} ILIKE ${unaccentSql(`$${values.length}`)} ESCAPE '\\'
          OR ${unaccentSql("p.descripcion")} ILIKE ${unaccentSql(`$${values.length}`)} ESCAPE '\\')`
      );
    }
    if (filters.categoria !== undefined) {
      values.push(filters.categoria);
      conditions.push(`p.categoria = $${values.length}`);
    }

    const where = conditions.join(" AND ");
    const order = orderBy(filters.orden);
    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;
    values.push(filters.pageSize, (filters.page - 1) * filters.pageSize);

    try {
      const [rows, count] = await Promise.all([
        this.pool.query<ProductRow>(
          `SELECT
             p.id,
             p.nombre,
             p.descripcion,
             p.categoria,
             p.tipo_entrega,
             p.sku,
             p.precio_centavos::text AS precio_centavos,
             btrim(p.moneda) AS moneda,
             p.creado_en,
             p.actualizado_en,
             s.id AS vendedor_id,
             s.nombre_comercial AS vendedor_nombre,
             ${availabilityExpression()} AS disponible,
             img.id AS imagen_id,
             img.url AS imagen_url,
             img.alt AS imagen_alt,
             img.orden AS imagen_orden
           FROM products p
           JOIN sellers s ON s.id = p.vendedor_id
           LEFT JOIN inventory i ON i.producto_id = p.id
           LEFT JOIN warehouses w ON w.id = i.bodega_id
           LEFT JOIN LATERAL (
             SELECT id, url, alt, orden
               FROM product_images
              WHERE producto_id = p.id
              ORDER BY orden
              LIMIT 1
           ) img ON TRUE
           WHERE ${where}
           GROUP BY p.id, s.id, s.nombre_comercial,
                    img.id, img.url, img.alt, img.orden
           ORDER BY ${order}
           LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
          values
        ),
        this.pool.query<{ total: string }>(
          `SELECT COUNT(*)::text AS total
             FROM products p
             JOIN sellers s ON s.id = p.vendedor_id
            WHERE ${where}`,
          values.slice(0, values.length - 2)
        )
      ]);

      return {
        items: rows.rows.map(toSummary),
        total: Number.parseInt(count.rows[0]?.total ?? "0", 10)
      };
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible consultar el catálogo.",
        { cause: error instanceof Error ? error.message : "unknown" }
      );
    }
  }

  async findPublicById(productoId: string): Promise<ProductDetail | null> {
    try {
      const result = await this.pool.query<ProductRow>(
        `SELECT
           p.id,
           p.nombre,
           p.descripcion,
           p.categoria,
           p.tipo_entrega,
           p.sku,
           p.precio_centavos::text AS precio_centavos,
           btrim(p.moneda) AS moneda,
           p.creado_en,
           p.actualizado_en,
           s.id AS vendedor_id,
           s.nombre_comercial AS vendedor_nombre,
           ${availabilityExpression()} AS disponible
         FROM products p
         JOIN sellers s ON s.id = p.vendedor_id
         LEFT JOIN inventory i ON i.producto_id = p.id
         LEFT JOIN warehouses w ON w.id = i.bodega_id
         WHERE p.id = $1 AND ${PUBLIC_FILTER}
         GROUP BY p.id, s.id, s.nombre_comercial`,
        [productoId]
      );

      const row = result.rows[0];
      if (!row) {
        return null;
      }

      const images = await this.pool.query<ImageRow>(
        `SELECT id, url, alt, orden
           FROM product_images
          WHERE producto_id = $1
          ORDER BY orden`,
        [productoId]
      );

      const imageModels = images.rows.map(toImage);
      const summary = toSummary(row);
      return {
        ...summary,
        imagenPrincipal: imageModels[0] ?? null,
        sku: row.sku,
        imagenes: imageModels,
        actualizadoEn: row.actualizado_en.toISOString()
      };
    } catch (error) {
      throw new DependencyUnavailableError(
        "No fue posible consultar el producto.",
        { cause: error instanceof Error ? error.message : "unknown" }
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function availabilityExpression(): string {
  return `CASE
            WHEN p.tipo_entrega = 'DIGITAL' THEN NULL
            ELSE COALESCE(SUM(
              CASE WHEN w.estado = 'ACTIVA'
                THEN GREATEST(i.on_hand - i.reserved - i.unavailable, 0)
                ELSE 0
              END
            ), 0)::int
          END`;
}

function orderBy(orden: CatalogFilters["orden"]): string {
  switch (orden) {
    case "precio_asc":
      return "p.precio_centavos ASC, p.id ASC";
    case "precio_desc":
      return "p.precio_centavos DESC, p.id ASC";
    case "nombre_asc":
      return "p.nombre ASC, p.id ASC";
    case "recientes":
    default:
      return "p.creado_en DESC, p.id ASC";
  }
}

function toSummary(row: ProductRow): ProductSummary {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    categoria: row.categoria,
    tipoEntrega: row.tipo_entrega,
    precio: {
      montoCentavos: Number.parseInt(row.precio_centavos, 10),
      moneda: row.moneda
    },
    imagenPrincipal:
      row.imagen_id !== null && row.imagen_url !== null
        ? {
            id: row.imagen_id,
            url: row.imagen_url,
            alt: row.imagen_alt ?? "",
            orden: row.imagen_orden ?? 0
          }
        : null,
    disponible: row.disponible,
    vendedor: {
      id: row.vendedor_id,
      nombreComercial: row.vendedor_nombre
    },
    creadoEn: row.creado_en.toISOString()
  };
}

function toImage(row: ImageRow): ImagenProducto {
  return { id: row.id, url: row.url, alt: row.alt, orden: row.orden };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/**
 * Búsqueda insensible a mayúsculas y acentos sin depender de la extensión
 * `unaccent` (que requiere privilegios de instalación).
 */
function unaccentSql(expression: string): string {
  return `translate(lower(${expression}), 'áéíóúüñ', 'aeiouun')`;
}
