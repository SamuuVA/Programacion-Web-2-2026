-- ADR-004: sesiones opacas del lado del servidor.
--
-- El cliente conserva un token aleatorio en una cookie HttpOnly. La base de
-- datos solo guarda su SHA-256: una filtración de la tabla no permite reutilizar
-- sesiones. No se usan JWT porque este proyecto necesita revocación inmediata y
-- un único backend local.

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL,
  token_hash text NOT NULL,
  creada_en timestamptz NOT NULL,
  expira_en timestamptz NOT NULL,
  revocada_en timestamptz,
  ultima_actividad_en timestamptz NOT NULL,
  correlation_id text NOT NULL,
  CONSTRAINT sessions_usuario_fk
    FOREIGN KEY (usuario_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT sessions_token_unique UNIQUE (token_hash),
  CONSTRAINT sessions_vigencia CHECK (expira_en > creada_en)
);

CREATE INDEX sessions_usuario_idx ON sessions (usuario_id);
CREATE INDEX sessions_vigentes_idx
  ON sessions (expira_en)
  WHERE revocada_en IS NULL;
