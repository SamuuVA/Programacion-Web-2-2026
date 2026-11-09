-- Operación logística: perfil del operador, ámbito de bodegas, envíos,
-- evidencia de entrega e historial de estados del pedido.
--
-- `L-26` exige que el alcance del operador provenga del contexto autorizado.
-- Se materializa con un perfil `logistics_operators` y la asignación explícita
-- de bodegas (`logistics_operator_warehouses`). El envío conserva la bodega de
-- origen que ya define el modelo (§13.1); el operador solo opera envíos cuya
-- bodega pertenece a su ámbito. No se inventan transportistas ni tracking: son
-- campos opcionales que solo se completan si el actor los aporta.
--
-- Las reservas pasan a `CONSUMIDA` al despachar (PI-17). El historial de
-- estados registra actor, timestamp, estado previo/nuevo y referencia causal
-- (ORD-05).

ALTER TABLE inventory_reservations
  DROP CONSTRAINT inventory_reservations_estado_check;
ALTER TABLE inventory_reservations
  ADD CONSTRAINT inventory_reservations_estado_check
  CHECK (estado IN ('ACTIVA', 'LIBERADA', 'CONSUMIDA'));
ALTER TABLE inventory_reservations
  ADD COLUMN consumida_en timestamptz;

ALTER TABLE orders
  ADD COLUMN entregado_en timestamptz;

CREATE TABLE logistics_operators (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL,
  nombre_operador text NOT NULL CHECK (btrim(nombre_operador) <> ''),
  estado text NOT NULL CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  creado_en timestamptz NOT NULL,
  CONSTRAINT logistics_operators_usuario_unique UNIQUE (usuario_id),
  CONSTRAINT logistics_operators_usuario_fk
    FOREIGN KEY (usuario_id) REFERENCES users (id)
);

CREATE TABLE logistics_operator_warehouses (
  operador_id uuid NOT NULL,
  bodega_id uuid NOT NULL,
  asignada_en timestamptz NOT NULL,
  CONSTRAINT logistics_operator_warehouses_pk
    PRIMARY KEY (operador_id, bodega_id),
  CONSTRAINT logistics_operator_warehouses_operador_fk
    FOREIGN KEY (operador_id) REFERENCES logistics_operators (id)
    ON DELETE CASCADE,
  CONSTRAINT logistics_operator_warehouses_bodega_fk
    FOREIGN KEY (bodega_id) REFERENCES warehouses (id)
);

CREATE INDEX logistics_operator_warehouses_bodega_idx
  ON logistics_operator_warehouses (bodega_id);

CREATE TABLE shipments (
  id uuid PRIMARY KEY,
  pedido_id uuid NOT NULL,
  bodega_origen_id uuid NOT NULL,
  transportista text,
  tracking_number text,
  estado text NOT NULL CHECK (
    estado IN (
      'PREPARACION', 'EMPACADO', 'DESPACHADO', 'EN_TRANSITO',
      'ENTREGADO', 'FALLIDO', 'DEVUELTO'
    )
  ),
  creado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  despachado_en timestamptz,
  entregado_en timestamptz,
  version integer NOT NULL CHECK (version > 0),
  CONSTRAINT shipments_pedido_fk
    FOREIGN KEY (pedido_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT shipments_bodega_fk
    FOREIGN KEY (bodega_origen_id) REFERENCES warehouses (id),
  CONSTRAINT shipments_pedido_bodega_unique
    UNIQUE (pedido_id, bodega_origen_id)
);

CREATE INDEX shipments_pedido_idx ON shipments (pedido_id);
CREATE INDEX shipments_bodega_idx ON shipments (bodega_origen_id, estado);

CREATE TABLE shipment_items (
  id uuid PRIMARY KEY,
  envio_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  CONSTRAINT shipment_items_envio_fk
    FOREIGN KEY (envio_id) REFERENCES shipments (id) ON DELETE CASCADE,
  CONSTRAINT shipment_items_producto_fk
    FOREIGN KEY (producto_id) REFERENCES products (id),
  CONSTRAINT shipment_items_envio_producto_unique
    UNIQUE (envio_id, producto_id)
);

CREATE INDEX shipment_items_envio_idx ON shipment_items (envio_id);

CREATE TABLE shipment_events (
  id uuid PRIMARY KEY,
  envio_id uuid NOT NULL,
  estado_previo text,
  estado_nuevo text NOT NULL,
  actor_id uuid NOT NULL,
  ocurrido_en timestamptz NOT NULL,
  referencia_tipo text NOT NULL CHECK (btrim(referencia_tipo) <> ''),
  referencia_id text NOT NULL CHECK (btrim(referencia_id) <> ''),
  correlation_id text NOT NULL CHECK (btrim(correlation_id) <> ''),
  CONSTRAINT shipment_events_envio_fk
    FOREIGN KEY (envio_id) REFERENCES shipments (id) ON DELETE CASCADE,
  CONSTRAINT shipment_events_actor_fk
    FOREIGN KEY (actor_id) REFERENCES users (id)
);

CREATE INDEX shipment_events_envio_idx
  ON shipment_events (envio_id, ocurrido_en);

CREATE TABLE delivery_evidence (
  id uuid PRIMARY KEY,
  envio_id uuid NOT NULL,
  tipo text NOT NULL CHECK (btrim(tipo) <> ''),
  referencia text NOT NULL CHECK (btrim(referencia) <> ''),
  nota text,
  registrada_por uuid NOT NULL,
  registrada_en timestamptz NOT NULL,
  CONSTRAINT delivery_evidence_envio_fk
    FOREIGN KEY (envio_id) REFERENCES shipments (id) ON DELETE CASCADE,
  CONSTRAINT delivery_evidence_actor_fk
    FOREIGN KEY (registrada_por) REFERENCES users (id)
);

CREATE INDEX delivery_evidence_envio_idx ON delivery_evidence (envio_id);

CREATE TABLE logistics_operations (
  id uuid PRIMARY KEY,
  operador_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('PREPARAR', 'DESPACHAR', 'ENTREGAR')),
  idempotency_key text NOT NULL CHECK (btrim(idempotency_key) <> ''),
  envio_id uuid NOT NULL,
  creado_en timestamptz NOT NULL,
  CONSTRAINT logistics_operations_operador_fk
    FOREIGN KEY (operador_id) REFERENCES logistics_operators (id),
  CONSTRAINT logistics_operations_envio_fk
    FOREIGN KEY (envio_id) REFERENCES shipments (id) ON DELETE CASCADE,
  CONSTRAINT logistics_operations_idempotencia_unique
    UNIQUE (operador_id, tipo, idempotency_key)
);

CREATE INDEX logistics_operations_envio_idx
  ON logistics_operations (envio_id);

-- ORD-05: toda transición conserva actor, instantes y referencia causal. El
-- actor puede ser nulo solo para procesos de sistema sin usuario resoluble.
CREATE TABLE order_status_history (
  id uuid PRIMARY KEY,
  pedido_id uuid NOT NULL,
  estado_previo text,
  estado_nuevo text NOT NULL,
  actor_id uuid,
  actor_rol text,
  ocurrido_en timestamptz NOT NULL,
  referencia_tipo text NOT NULL CHECK (btrim(referencia_tipo) <> ''),
  referencia_id text NOT NULL CHECK (btrim(referencia_id) <> ''),
  correlation_id text NOT NULL CHECK (btrim(correlation_id) <> ''),
  CONSTRAINT order_status_history_pedido_fk
    FOREIGN KEY (pedido_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_status_history_actor_fk
    FOREIGN KEY (actor_id) REFERENCES users (id)
);

CREATE INDEX order_status_history_pedido_idx
  ON order_status_history (pedido_id, ocurrido_en);

CREATE INDEX orders_estado_idx ON orders (estado, creado_en DESC);
