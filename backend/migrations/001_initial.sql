CREATE TABLE users (
  id uuid PRIMARY KEY,
  nombre_completo text NOT NULL,
  correo_normalizado text NOT NULL,
  documento_tipo text NOT NULL,
  documento_pais text NOT NULL,
  documento_numero text NOT NULL,
  hash_credencial text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('COMPRADOR', 'VENDEDOR', 'OPERADOR_LOGISTICO', 'ADMINISTRADOR', 'SUPERVISOR')),
  estado text NOT NULL CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
  creado_en timestamptz NOT NULL,
  actualizado_en timestamptz NOT NULL,
  CONSTRAINT users_correo_unique UNIQUE (correo_normalizado),
  CONSTRAINT users_documento_unique UNIQUE (documento_tipo, documento_pais, documento_numero)
);

CREATE TABLE buyers (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL,
  estado_comercial text NOT NULL CHECK (estado_comercial IN ('HABILITADO', 'RESTRINGIDO')),
  creado_en timestamptz NOT NULL,
  CONSTRAINT buyers_usuario_unique UNIQUE (usuario_id),
  CONSTRAINT buyers_usuario_fk FOREIGN KEY (usuario_id) REFERENCES users (id)
);

CREATE TABLE carts (
  id uuid PRIMARY KEY,
  comprador_id uuid NOT NULL,
  actualizado_en timestamptz NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  CONSTRAINT carts_comprador_unique UNIQUE (comprador_id),
  CONSTRAINT carts_comprador_fk FOREIGN KEY (comprador_id) REFERENCES buyers (id)
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY,
  evento text NOT NULL,
  recurso_tipo text NOT NULL,
  recurso_id text NOT NULL,
  actor_id text NOT NULL,
  rol_actor text,
  ocurrido_en timestamptz NOT NULL,
  correlation_id text NOT NULL,
  causation_id text,
  resultado text NOT NULL CHECK (resultado IN ('EXITO', 'RECHAZO', 'ERROR')),
  gravedad text NOT NULL CHECK (gravedad IN ('INFORMACION', 'ADVERTENCIA', 'ERROR', 'CRITICO')),
  detalles jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT audit_log_no_secretos CHECK (
    NOT (detalles ? 'credencial')
    AND NOT (detalles ? 'password')
    AND NOT (detalles ? 'hashCredencial')
  )
);

CREATE TABLE outbox (
  id uuid PRIMARY KEY,
  tipo text NOT NULL,
  version_esquema integer NOT NULL,
  agregado_tipo text NOT NULL,
  agregado_id text NOT NULL,
  ocurrido_en timestamptz NOT NULL,
  correlation_id text NOT NULL,
  payload jsonb NOT NULL,
  publicado_en timestamptz,
  intentos integer NOT NULL DEFAULT 0,
  ultimo_error text
);

CREATE INDEX audit_log_correlation_idx ON audit_log (correlation_id);
CREATE INDEX audit_log_recurso_idx ON audit_log (recurso_tipo, recurso_id);
CREATE INDEX outbox_pendientes_idx ON outbox (publicado_en, ocurrido_en);
