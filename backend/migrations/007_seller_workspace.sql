-- Espacio de trabajo del vendedor: fase de borrador y trazabilidad de stock.
--
-- `BORRADOR` es la fase de creación reconocida por el SDD (§7.1). No es un
-- estado comercial público: el catálogo sigue mostrando solo `PUBLICADO`.
-- `inventory_movements` conserva el hecho que originó cada cambio de stock
-- (INV-04/INV-05). El saldo de `inventory` sigue siendo la posición vigente.

ALTER TABLE products DROP CONSTRAINT products_estado_check;
ALTER TABLE products ADD CONSTRAINT products_estado_check
  CHECK (estado IN ('BORRADOR', 'PUBLICADO', 'SUSPENDIDO', 'DESCONTINUADO'));

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY,
  inventario_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  bodega_id uuid NOT NULL,
  vendedor_id uuid NOT NULL,
  tipo text NOT NULL CHECK (
    tipo IN (
      'INGRESO', 'RESERVA', 'LIBERACION_RESERVA', 'SALIDA_VENTA',
      'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCION_VENDIBLE',
      'DEVOLUCION_NO_VENDIBLE', 'BAJA_DANIO'
    )
  ),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  referencia_tipo text NOT NULL CHECK (btrim(referencia_tipo) <> ''),
  referencia_id text NOT NULL CHECK (btrim(referencia_id) <> ''),
  actor_id uuid NOT NULL,
  motivo text,
  ocurrido_en timestamptz NOT NULL,
  idempotency_key text NOT NULL CHECK (btrim(idempotency_key) <> ''),
  CONSTRAINT inventory_movements_inventario_fk
    FOREIGN KEY (inventario_id) REFERENCES inventory (id),
  CONSTRAINT inventory_movements_producto_fk
    FOREIGN KEY (producto_id) REFERENCES products (id),
  CONSTRAINT inventory_movements_bodega_fk
    FOREIGN KEY (bodega_id) REFERENCES warehouses (id),
  CONSTRAINT inventory_movements_vendedor_fk
    FOREIGN KEY (vendedor_id) REFERENCES sellers (id),
  CONSTRAINT inventory_movements_actor_fk
    FOREIGN KEY (actor_id) REFERENCES users (id),
  CONSTRAINT inventory_movements_idempotencia_unique
    UNIQUE (vendedor_id, idempotency_key)
);

CREATE INDEX inventory_movements_producto_idx
  ON inventory_movements (producto_id, ocurrido_en DESC);
CREATE INDEX inventory_movements_bodega_idx
  ON inventory_movements (bodega_id, ocurrido_en DESC);
CREATE INDEX products_vendedor_idx
  ON products (vendedor_id, creado_en DESC);
CREATE INDEX warehouses_vendedor_idx
  ON warehouses (vendedor_id, creada_en DESC);
