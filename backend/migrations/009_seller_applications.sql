-- Solicitudes de incorporación de compradores a vendedores.
--
-- La solicitud es un agregado independiente del estado de acceso del usuario y
-- del estado comercial del comprador. Aprobar una solicitud conserva la misma
-- identidad (`users.id`), cambia su rol principal a VENDEDOR y crea el perfil de
-- vendedor junto con su primera bodega en una sola transacción. Rechazar no
-- crea vendedor ni bodega y no modifica el estado de acceso del comprador.

CREATE TABLE seller_applications (
  id uuid PRIMARY KEY,
  usuario_id uuid NOT NULL,
  nombre_comercial text NOT NULL CHECK (btrim(nombre_comercial) <> ''),
  nombre_bodega text NOT NULL CHECK (btrim(nombre_bodega) <> ''),
  ubicacion_bodega text NOT NULL CHECK (btrim(ubicacion_bodega) <> ''),
  estado text NOT NULL CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
  motivo_rechazo text,
  revisado_por uuid,
  revisado_en timestamptz,
  creada_en timestamptz NOT NULL,
  actualizada_en timestamptz NOT NULL,
  CONSTRAINT seller_applications_usuario_fk
    FOREIGN KEY (usuario_id) REFERENCES users (id),
  CONSTRAINT seller_applications_revisor_fk
    FOREIGN KEY (revisado_por) REFERENCES users (id),
  CONSTRAINT seller_applications_rechazo_check CHECK (
    (estado = 'RECHAZADA'
      AND motivo_rechazo IS NOT NULL
      AND btrim(motivo_rechazo) <> ''
      AND revisado_por IS NOT NULL
      AND revisado_en IS NOT NULL)
    OR estado <> 'RECHAZADA'
  ),
  CONSTRAINT seller_applications_aprobacion_check CHECK (
    (estado = 'APROBADA'
      AND revisado_por IS NOT NULL
      AND revisado_en IS NOT NULL)
    OR estado <> 'APROBADA'
  )
);

-- Una sola solicitud pendiente por usuario. El historial de solicitudes
-- rechazadas o aprobadas se conserva.
CREATE UNIQUE INDEX seller_applications_pending_unique
  ON seller_applications (usuario_id)
  WHERE estado = 'PENDIENTE';

CREATE INDEX seller_applications_estado_idx
  ON seller_applications (estado, creada_en DESC);
CREATE INDEX seller_applications_usuario_idx
  ON seller_applications (usuario_id, creada_en DESC);
