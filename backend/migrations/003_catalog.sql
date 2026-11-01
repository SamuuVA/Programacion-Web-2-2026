-- Catálogo V1: sin variantes comerciales.
-- Cada producto es una combinación vendible independiente con SKU, precio e
-- imágenes propias. El inventario se lleva por producto y bodega.

CREATE TABLE sellers (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL,
  nombre_comercial text NOT NULL CHECK (btrim(nombre_comercial) <> ''),
  estado text NOT NULL CHECK (estado IN ('EN_REVISION', 'ACTIVO', 'SUSPENDIDO', 'INACTIVO')),
  creado_en timestamptz NOT NULL,
  CONSTRAINT sellers_usuario_unique UNIQUE (usuario_id),
  CONSTRAINT sellers_usuario_fk FOREIGN KEY (usuario_id) REFERENCES users (id)
);

CREATE TABLE warehouses (
  id uuid PRIMARY KEY,
  vendedor_id uuid,
  nombre text NOT NULL CHECK (btrim(nombre) <> ''),
  ubicacion text NOT NULL CHECK (btrim(ubicacion) <> ''),
  tipo text NOT NULL CHECK (tipo IN ('MARKETPLACE', 'VENDEDOR')),
  estado text NOT NULL CHECK (estado IN ('ACTIVA', 'INACTIVA')),
  creada_en timestamptz NOT NULL,
  CONSTRAINT warehouses_vendedor_fk FOREIGN KEY (vendedor_id) REFERENCES sellers (id),
  CONSTRAINT warehouses_propietario CHECK (
    (tipo = 'VENDEDOR' AND vendedor_id IS NOT NULL)
    OR (tipo = 'MARKETPLACE' AND vendedor_id IS NULL)
  )
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  vendedor_id uuid NOT NULL,
  nombre text NOT NULL CHECK (btrim(nombre) <> ''),
  descripcion text NOT NULL CHECK (btrim(descripcion) <> ''),
  categoria text NOT NULL CHECK (categoria IN ('ELECTRONICA', 'ROPA', 'HOGAR', 'DIGITAL')),
  estado text NOT NULL CHECK (estado IN ('PUBLICADO', 'SUSPENDIDO', 'DESCONTINUADO')),
  tipo_entrega text NOT NULL CHECK (tipo_entrega IN ('FISICA', 'DIGITAL')),
  sku text NOT NULL CHECK (btrim(sku) <> ''),
  precio_centavos bigint NOT NULL CHECK (precio_centavos > 0),
  moneda char(3) NOT NULL CHECK (moneda ~ '^[A-Z]{3}$'),
  creado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT products_vendedor_fk FOREIGN KEY (vendedor_id) REFERENCES sellers (id),
  CONSTRAINT products_sku_unique UNIQUE (sku)
);

CREATE TABLE product_images (
  id uuid PRIMARY KEY,
  producto_id uuid NOT NULL,
  url text NOT NULL CHECK (btrim(url) <> ''),
  alt text NOT NULL DEFAULT '',
  orden integer NOT NULL CHECK (orden >= 0),
  creado_en timestamptz NOT NULL,
  CONSTRAINT product_images_producto_fk
    FOREIGN KEY (producto_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT product_images_orden_unique UNIQUE (producto_id, orden)
);

CREATE TABLE inventory (
  id uuid PRIMARY KEY,
  producto_id uuid NOT NULL,
  bodega_id uuid NOT NULL,
  on_hand integer NOT NULL CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  unavailable integer NOT NULL DEFAULT 0 CHECK (unavailable >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT inventory_producto_fk FOREIGN KEY (producto_id) REFERENCES products (id),
  CONSTRAINT inventory_bodega_fk FOREIGN KEY (bodega_id) REFERENCES warehouses (id),
  CONSTRAINT inventory_producto_bodega_unique UNIQUE (producto_id, bodega_id),
  CONSTRAINT inventory_saldos CHECK (reserved + unavailable <= on_hand)
);

CREATE INDEX products_publicos_idx
  ON products (estado, categoria, creado_en DESC);
CREATE INDEX product_images_producto_idx
  ON product_images (producto_id, orden);
CREATE INDEX inventory_producto_idx
  ON inventory (producto_id);
CREATE INDEX warehouses_estado_idx
  ON warehouses (estado);
