-- Carrito persistente, checkout idempotente, pedidos, pagos simulados y
-- reservas de inventario.
--
-- El carrito guarda el precio que el comprador vio al agregar la línea. El
-- checkout compara ese valor con el precio actual: si cambió, exige una
-- confirmación explícita (CAR-07). El carrito nunca reserva stock.

CREATE TABLE cart_items (
  carrito_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_referencial_centavos bigint NOT NULL CHECK (precio_referencial_centavos > 0),
  moneda_referencial char(3) NOT NULL CHECK (moneda_referencial ~ '^[A-Z]{3}$'),
  agregado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT cart_items_pk PRIMARY KEY (carrito_id, producto_id),
  CONSTRAINT cart_items_carrito_fk
    FOREIGN KEY (carrito_id) REFERENCES carts (id) ON DELETE CASCADE,
  CONSTRAINT cart_items_producto_fk
    FOREIGN KEY (producto_id) REFERENCES products (id)
);

CREATE INDEX cart_items_producto_idx ON cart_items (producto_id);

-- Un intento de checkout por (comprador, clave de idempotencia). El resultado
-- final se guarda como JSON para que un reintento devuelva exactamente el mismo
-- pedido y no vuelva a cobrar ni a reservar.
CREATE TABLE checkout_attempts (
  id uuid PRIMARY KEY,
  comprador_id uuid NOT NULL,
  idempotency_key text NOT NULL CHECK (btrim(idempotency_key) <> ''),
  estado text NOT NULL CHECK (
    estado IN ('PROCESANDO', 'CONFIRMADO', 'RECHAZADO', 'DESCONOCIDO')
  ),
  resultado jsonb,
  creado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT checkout_attempts_comprador_fk
    FOREIGN KEY (comprador_id) REFERENCES buyers (id),
  CONSTRAINT checkout_attempts_idempotencia_unique
    UNIQUE (comprador_id, idempotency_key)
);

CREATE INDEX checkout_attempts_comprador_idx
  ON checkout_attempts (comprador_id, creado_en DESC);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  checkout_id uuid NOT NULL,
  comprador_id uuid NOT NULL,
  vendedor_id uuid NOT NULL,
  numero text NOT NULL CHECK (btrim(numero) <> ''),
  estado text NOT NULL CHECK (
    estado IN (
      'PENDIENTE_DE_PAGO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO',
      'ENTREGADO', 'CANCELADO', 'CERRADO'
    )
  ),
  estado_pago text NOT NULL CHECK (
    estado_pago IN (
      'PENDIENTE', 'AUTORIZADO', 'CAPTURADO', 'RECHAZADO', 'CANCELADO',
      'REEMBOLSO_PARCIAL', 'REEMBOLSADO'
    )
  ),
  moneda char(3) NOT NULL CHECK (moneda ~ '^[A-Z]{3}$'),
  total_centavos bigint NOT NULL CHECK (total_centavos > 0),
  direccion_entrega jsonb,
  creado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT orders_checkout_fk
    FOREIGN KEY (checkout_id) REFERENCES checkout_attempts (id),
  CONSTRAINT orders_comprador_fk
    FOREIGN KEY (comprador_id) REFERENCES buyers (id),
  CONSTRAINT orders_vendedor_fk
    FOREIGN KEY (vendedor_id) REFERENCES sellers (id),
  CONSTRAINT orders_numero_unique UNIQUE (numero)
);

CREATE INDEX orders_comprador_idx ON orders (comprador_id, creado_en DESC);
CREATE INDEX orders_vendedor_idx ON orders (vendedor_id, creado_en DESC);
CREATE INDEX orders_checkout_idx ON orders (checkout_id);

CREATE TABLE order_items (
  id uuid PRIMARY KEY,
  pedido_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  vendedor_id uuid NOT NULL,
  nombre_producto text NOT NULL CHECK (btrim(nombre_producto) <> ''),
  sku text NOT NULL CHECK (btrim(sku) <> ''),
  tipo_entrega text NOT NULL CHECK (tipo_entrega IN ('FISICA', 'DIGITAL')),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario_centavos bigint NOT NULL CHECK (precio_unitario_centavos > 0),
  moneda char(3) NOT NULL CHECK (moneda ~ '^[A-Z]{3}$'),
  subtotal_centavos bigint NOT NULL CHECK (subtotal_centavos > 0),
  CONSTRAINT order_items_pedido_fk
    FOREIGN KEY (pedido_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_producto_fk
    FOREIGN KEY (producto_id) REFERENCES products (id),
  CONSTRAINT order_items_vendedor_fk
    FOREIGN KEY (vendedor_id) REFERENCES sellers (id)
);

CREATE INDEX order_items_pedido_idx ON order_items (pedido_id);

CREATE TABLE payments (
  id uuid PRIMARY KEY,
  pedido_id uuid NOT NULL,
  estado text NOT NULL CHECK (
    estado IN (
      'PENDIENTE', 'AUTORIZADO', 'CAPTURADO', 'RECHAZADO', 'CANCELADO',
      'REEMBOLSO_PARCIAL', 'REEMBOLSADO'
    )
  ),
  proveedor text NOT NULL CHECK (btrim(proveedor) <> ''),
  referencia text,
  monto_centavos bigint NOT NULL CHECK (monto_centavos > 0),
  moneda char(3) NOT NULL CHECK (moneda ~ '^[A-Z]{3}$'),
  creado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT payments_pedido_fk
    FOREIGN KEY (pedido_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE INDEX payments_pedido_idx ON payments (pedido_id);

-- Trazabilidad exacta de qué bodega reservó cada unidad. Permite liberar la
-- reserva una sola vez si el pago es rechazado.
CREATE TABLE inventory_reservations (
  id uuid PRIMARY KEY,
  checkout_id uuid NOT NULL,
  pedido_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  bodega_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  estado text NOT NULL CHECK (estado IN ('ACTIVA', 'LIBERADA')),
  creada_en timestamptz NOT NULL,
  liberada_en timestamptz,
  CONSTRAINT inventory_reservations_checkout_fk
    FOREIGN KEY (checkout_id) REFERENCES checkout_attempts (id),
  CONSTRAINT inventory_reservations_pedido_fk
    FOREIGN KEY (pedido_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT inventory_reservations_producto_fk
    FOREIGN KEY (producto_id) REFERENCES products (id),
  CONSTRAINT inventory_reservations_bodega_fk
    FOREIGN KEY (bodega_id) REFERENCES warehouses (id)
);

CREATE INDEX inventory_reservations_checkout_idx
  ON inventory_reservations (checkout_id, estado);
CREATE INDEX inventory_reservations_pedido_idx
  ON inventory_reservations (pedido_id);
