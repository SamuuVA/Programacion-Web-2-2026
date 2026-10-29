-- Refuerza la auditoría para que las claves sensibles se detecten también
-- dentro de objetos y arrays anidados, no solo en el nivel raíz.
--
-- La comprobación se hace en PostgreSQL para que ninguna ruta de escritura
-- pueda omitirla. Las claves se normalizan sin separadores y sin distinguir
-- mayúsculas: `hash_credencial`, `hashCredencial` y `hash-credencial` son
-- equivalentes.

CREATE OR REPLACE FUNCTION audit_details_has_sensitive_key(value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN value IS NULL THEN false
    WHEN jsonb_typeof(value) = 'object' THEN
      EXISTS (
        SELECT 1
        FROM jsonb_each(value) AS entry(key, value)
        WHERE lower(regexp_replace(entry.key, '[^a-zA-Z0-9]', '', 'g')) = ANY (
          ARRAY[
            'credencial',
            'contrasena',
            'password',
            'passwd',
            'hashcredencial',
            'credencialhash',
            'passwordhash',
            'token',
            'accesstoken',
            'refreshtoken',
            'authorization',
            'cookie',
            'setcookie',
            'secret',
            'secreto',
            'apikey'
          ]
        )
        OR audit_details_has_sensitive_key(entry.value)
      )
    WHEN jsonb_typeof(value) = 'array' THEN
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(value) AS item(value)
        WHERE audit_details_has_sensitive_key(item.value)
      )
    ELSE false
  END
$function$;

ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_no_secretos;
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_no_secretos
  CHECK (NOT audit_details_has_sensitive_key(detalles));
