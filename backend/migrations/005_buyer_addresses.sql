-- L-01: dirección de entrega mínima del comprador.
--
-- La composición exacta no estaba fijada en las fuentes. Se adopta el conjunto
-- mínimo necesario para entregar un pedido físico en Colombia y se documenta en
-- docs/implementation/L-01-DIRECCIONES.md. `pais` usa ISO 3166-1 alfa-2.
--
-- La dirección principal es única por comprador mediante un índice parcial. El
-- pedido conserva una copia inmutable (snapshot) en `orders.direccion_entrega`;
-- editar o eliminar esta fila no altera pedidos históricos.

CREATE TABLE buyer_addresses (
  id uuid PRIMARY KEY,
  comprador_id uuid NOT NULL,
  destinatario text NOT NULL CHECK (btrim(destinatario) <> ''),
  telefono text NOT NULL CHECK (btrim(telefono) <> ''),
  linea1 text NOT NULL CHECK (btrim(linea1) <> ''),
  linea2 text,
  ciudad text NOT NULL CHECK (btrim(ciudad) <> ''),
  region text NOT NULL CHECK (btrim(region) <> ''),
  codigo_postal text,
  pais char(2) NOT NULL CHECK (pais ~ '^[A-Z]{2}$'),
  es_principal boolean NOT NULL DEFAULT false,
  creada_en timestamptz NOT NULL,
  actualizada_en timestamptz NOT NULL,
  CONSTRAINT buyer_addresses_comprador_fk
    FOREIGN KEY (comprador_id) REFERENCES buyers (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX buyer_addresses_principal_unique
  ON buyer_addresses (comprador_id)
  WHERE es_principal;
CREATE INDEX buyer_addresses_comprador_idx
  ON buyer_addresses (comprador_id, creada_en);
