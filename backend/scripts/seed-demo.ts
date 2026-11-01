import "dotenv/config";
import { Pool } from "pg";
import { Argon2PasswordHasher } from "../src/modules/identity/infrastructure/argon2-password-hasher.js";

/**
 * Seed de demostración.
 *
 * Escribe datos reales en PostgreSQL para poder presentar el catálogo. No es
 * un mock de la API: los productos viven en las mismas tablas y pasan por las
 * mismas consultas que cualquier dato creado por un vendedor.
 *
 * Uso explícito: `npm run db:seed:demo`.
 */

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? "NexusMarketDemo2026!";

const SELLERS = [
  {
    usuarioId: "10000000-0000-4000-8000-000000000001",
    sellerId: "20000000-0000-4000-8000-000000000001",
    warehouseId: "30000000-0000-4000-8000-000000000001",
    nombreUsuario: "Aurora Vendedora",
    correo: "aurora@nexusmarket.demo",
    documento: "DEMO-AURORA-001",
    nombreComercial: "Estudio Aurora",
    bodega: "Bodega Aurora · Bogotá"
  },
  {
    usuarioId: "10000000-0000-4000-8000-000000000002",
    sellerId: "20000000-0000-4000-8000-000000000002",
    warehouseId: "30000000-0000-4000-8000-000000000002",
    nombreUsuario: "Nido Vendedora",
    correo: "nido@nexusmarket.demo",
    documento: "DEMO-NIDO-001",
    nombreComercial: "Casa Nido",
    bodega: "Bodega Nido · Medellín"
  }
] as const;

const PRODUCTS = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    sellerId: SELLERS[0].sellerId,
    warehouseId: SELLERS[0].warehouseId,
    nombre: "Audífonos Aurora",
    descripcion:
      "Audífonos inalámbricos con cancelación activa de ruido, hasta 30 horas de reproducción y estuche rígido de viaje.",
    categoria: "ELECTRONICA",
    sku: "AUR-AUD-001",
    precioCentavos: 42990000,
    stock: 18,
    imagen: "audifonos-aurora.svg",
    alt: "Audífonos inalámbricos color verde bosque"
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    sellerId: SELLERS[0].sellerId,
    warehouseId: SELLERS[0].warehouseId,
    nombre: "Parlante Órbita",
    descripcion:
      "Parlante portátil resistente al agua con sonido estéreo, batería de 12 horas y correa de transporte.",
    categoria: "ELECTRONICA",
    sku: "AUR-PAR-002",
    precioCentavos: 27990000,
    stock: 11,
    imagen: "parlante-orbita.svg",
    alt: "Parlante portátil cilíndrico color arena"
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    sellerId: SELLERS[1].sellerId,
    warehouseId: SELLERS[1].warehouseId,
    nombre: "Lámpara Nido",
    descripcion:
      "Lámpara de mesa con luz cálida regulable, base de madera maciza y pantalla de tela tejida a mano.",
    categoria: "HOGAR",
    sku: "NID-LAM-003",
    precioCentavos: 18990000,
    stock: 7,
    imagen: "lampara-nido.svg",
    alt: "Lámpara de mesa con base de madera y pantalla clara"
  },
  {
    id: "40000000-0000-4000-8000-000000000004",
    sellerId: SELLERS[1].sellerId,
    warehouseId: SELLERS[1].warehouseId,
    nombre: "Manta Sierra",
    descripcion:
      "Manta tejida en algodón peinado, textura suave y acabado neutro para sofá o cama.",
    categoria: "HOGAR",
    sku: "NID-MAN-004",
    precioCentavos: 12990000,
    stock: 24,
    imagen: "manta-sierra.svg",
    alt: "Manta tejida doblada sobre una superficie clara"
  },
  {
    id: "40000000-0000-4000-8000-000000000005",
    sellerId: SELLERS[0].sellerId,
    warehouseId: SELLERS[0].warehouseId,
    nombre: "Chaqueta Andes",
    descripcion:
      "Chaqueta ligera cortavientos con capucha ajustable, bolsillos laterales y cierre frontal.",
    categoria: "ROPA",
    sku: "AUR-CHA-005",
    precioCentavos: 21990000,
    stock: 9,
    imagen: "chaqueta-andes.svg",
    alt: "Chaqueta cortavientos verde oliva"
  },
  {
    id: "40000000-0000-4000-8000-000000000006",
    sellerId: SELLERS[1].sellerId,
    warehouseId: SELLERS[1].warehouseId,
    nombre: "Camiseta Raíz",
    descripcion:
      "Camiseta de algodón orgánico con corte relajado y estampado minimalista en el pecho.",
    categoria: "ROPA",
    sku: "NID-CAM-006",
    precioCentavos: 7990000,
    stock: 31,
    imagen: "camiseta-raiz.svg",
    alt: "Camiseta clara con estampado minimalista"
  },
  {
    id: "40000000-0000-4000-8000-000000000007",
    sellerId: SELLERS[0].sellerId,
    warehouseId: null,
    nombre: "Curso de fotografía urbana",
    descripcion:
      "Curso digital descargable con seis módulos, ejercicios prácticos y recursos editables para fotografía de calle.",
    categoria: "DIGITAL",
    sku: "AUR-DIG-007",
    precioCentavos: 9900000,
    stock: null,
    imagen: "curso-fotografia.svg",
    alt: "Portada del curso de fotografía urbana"
  },
  {
    id: "40000000-0000-4000-8000-000000000008",
    sellerId: SELLERS[1].sellerId,
    warehouseId: null,
    nombre: "Guía práctica de finanzas personales",
    descripcion:
      "Guía digital en PDF con plantillas de presupuesto y un método paso a paso para organizar ingresos y gastos.",
    categoria: "DIGITAL",
    sku: "NID-DIG-008",
    precioCentavos: 5900000,
    stock: null,
    imagen: "guia-finanzas.svg",
    alt: "Portada de la guía de finanzas personales"
  }
] as const;

const DATABASE_URL = process.env.DATABASE_URL?.trim();
if (!DATABASE_URL) {
  console.error("DATABASE_URL es obligatoria para ejecutar el seed de demostración.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const hasher = new Argon2PasswordHasher();
const now = new Date();

try {
  const hash = await hasher.hash(DEMO_PASSWORD);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const seller of SELLERS) {
      await client.query(
        `INSERT INTO users (
           id, nombre_completo, correo_normalizado, documento_tipo, documento_pais,
           documento_numero, hash_credencial, rol, estado, creado_en, actualizado_en
         ) VALUES ($1, $2, $3, 'CC', 'CO', $4, $5, 'VENDEDOR', 'ACTIVO', $6, $6)
         ON CONFLICT (id) DO UPDATE SET
           nombre_completo = EXCLUDED.nombre_completo,
           correo_normalizado = EXCLUDED.correo_normalizado,
           documento_numero = EXCLUDED.documento_numero,
           hash_credencial = EXCLUDED.hash_credencial,
           actualizado_en = EXCLUDED.actualizado_en`,
        [
          seller.usuarioId,
          seller.nombreUsuario,
          seller.correo,
          seller.documento,
          hash,
          now
        ]
      );
      await client.query(
        `INSERT INTO sellers (id, usuario_id, nombre_comercial, estado, creado_en)
         VALUES ($1, $2, $3, 'ACTIVO', $4)
         ON CONFLICT (id) DO UPDATE SET
           nombre_comercial = EXCLUDED.nombre_comercial,
           estado = 'ACTIVO'`,
        [seller.sellerId, seller.usuarioId, seller.nombreComercial, now]
      );
      await client.query(
        `INSERT INTO warehouses (
           id, vendedor_id, nombre, ubicacion, tipo, estado, creada_en
         ) VALUES ($1, $2, $3, $4, 'VENDEDOR', 'ACTIVA', $5)
         ON CONFLICT (id) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           ubicacion = EXCLUDED.ubicacion,
           estado = 'ACTIVA'`,
        [
          seller.warehouseId,
          seller.sellerId,
          seller.bodega,
          seller.nombreComercial.includes("Aurora")
            ? "Bogotá, Colombia"
            : "Medellín, Colombia",
          now
        ]
      );
    }

    for (const product of PRODUCTS) {
      const tipoEntrega = product.stock === null ? "DIGITAL" : "FISICA";
      await client.query(
        `INSERT INTO products (
           id, vendedor_id, nombre, descripcion, categoria, estado, tipo_entrega,
           sku, precio_centavos, moneda, creado_en, actualizado_en
         ) VALUES ($1, $2, $3, $4, $5, 'PUBLICADO', $6, $7, $8, 'COP', $9, $9)
         ON CONFLICT (id) DO UPDATE SET
           vendedor_id = EXCLUDED.vendedor_id,
           nombre = EXCLUDED.nombre,
           descripcion = EXCLUDED.descripcion,
           categoria = EXCLUDED.categoria,
           estado = 'PUBLICADO',
           tipo_entrega = EXCLUDED.tipo_entrega,
           sku = EXCLUDED.sku,
           precio_centavos = EXCLUDED.precio_centavos,
           moneda = EXCLUDED.moneda,
           actualizado_en = EXCLUDED.actualizado_en`,
        [
          product.id,
          product.sellerId,
          product.nombre,
          product.descripcion,
          product.categoria,
          tipoEntrega,
          product.sku,
          product.precioCentavos,
          now
        ]
      );

      await client.query("DELETE FROM product_images WHERE producto_id = $1", [
        product.id
      ]);
      await client.query(
        `INSERT INTO product_images (id, producto_id, url, alt, orden, creado_en)
         VALUES ($1, $2, $3, $4, 0, $5)`,
        [
          imageId(product.id),
          product.id,
          `/products/${product.imagen}`,
          product.alt,
          now
        ]
      );

      if (product.stock !== null && product.warehouseId !== null) {
        await client.query(
          `INSERT INTO inventory (
             id, producto_id, bodega_id, on_hand, reserved, unavailable,
             version, actualizado_en
           ) VALUES ($1, $2, $3, $4, 0, 0, 1, $5)
           ON CONFLICT (producto_id, bodega_id) DO UPDATE SET
             on_hand = EXCLUDED.on_hand,
             reserved = 0,
             unavailable = 0,
             actualizado_en = EXCLUDED.actualizado_en`,
          [
            inventoryId(product.id),
            product.id,
            product.warehouseId,
            product.stock,
            now
          ]
        );
      }
    }

    await client.query("COMMIT");
    console.log(`Seed de demostración aplicado: ${PRODUCTS.length} productos publicados.`);
    console.log("Vendedores demo: aurora@nexusmarket.demo / nido@nexusmarket.demo");
    console.log("La contraseña demo solo se usa para desarrollo local.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(
    "No fue posible aplicar el seed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

function imageId(productId: string): string {
  return `50000000-0000-4000-8000-${productId.slice(-12)}`;
}

function inventoryId(productId: string): string {
  return `60000000-0000-4000-8000-${productId.slice(-12)}`;
}
