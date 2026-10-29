# NexusMarket Backend

Primer vertical ejecutable: **PI-01 `RegisterBuyer`** en TypeScript/Node.js.

## Alcance

Incluido:

- registro público de comprador;
- `Usuario` con rol `COMPRADOR` y estado `ACTIVO`;
- `PerfilComprador` con estado `HABILITADO` y sin direcciones;
- `Carrito` vacío, versión 1;
- hash Argon2id con parámetros `DEC-W1-008`;
- auditoría y evento de outbox en la misma transacción;
- endpoint HTTP, validación, correlación y errores uniformes;
- persistencia PostgreSQL y adaptador en memoria para desarrollo/pruebas;
- pruebas de contrato de `POST /api/v1/buyers`, `/health` y `/ready`;
- prueba de integración PostgreSQL reproducible, con concurrencia, `409`, rollback y limpieza dirigida.

Fuera de alcance:

- autenticación, sesiones y autorización;
- pagos y simuladores de pago;
- imágenes o almacenamiento de archivos;
- catálogo, variantes, inventario, direcciones, pedidos, devoluciones y frontend;
- Mongo para auditoría en este vertical.

## Requisitos

- Node.js **24.x** (fijado en `engines`; verificado con `v24.21.0`).
- npm 11+.
- PostgreSQL 17+ solo si se usa `PERSISTENCE=postgres`.
- Docker es opcional; no es necesario para el adaptador en memoria.

## Instalación

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

No hay secretos reales en `.env.example`.

## Ejecutar en desarrollo

Modo efímero, sin base de datos:

```powershell
$env:PERSISTENCE = "memory"
npm run dev
```

Servidor por defecto: `http://127.0.0.1:3000`. `HOST` tiene valor inicial `127.0.0.1`; para un contenedor o acceso externo hay que definir `HOST=0.0.0.0` de forma explícita.

Health y readiness:

```powershell
curl.exe http://127.0.0.1:3000/health
curl.exe http://127.0.0.1:3000/ready
```

## Registrar un comprador

```powershell
$json = '{"nombreCompleto":"Ana Pérez","correoElectronico":"ana@example.com","documentoIdentidad":{"tipo":"CC","pais":"CO","numero":"123456789"},"credencial":"correct horse battery staple"}'
$path = Join-Path $env:TEMP "buyer.json"
[IO.File]::WriteAllText($path, $json, (New-Object System.Text.UTF8Encoding($false)))
curl.exe -i -X POST "http://127.0.0.1:3000/api/v1/buyers" `
  -H "Content-Type: application/json" `
  -H "x-correlation-id: demo-001" `
  --data-binary "@$path"
```

Respuesta esperada: `201 Created` con `usuarioId`, `compradorId`, `carritoId`, estados y correo normalizado.

Errores:

- `400 VALIDACION_INVALIDA`: cuerpo, JSON, formato o propiedad desconocida.
- `409 CONFLICTO_UNICIDAD`: correo o documento ya registrado.
- `413 VALIDACION_INVALIDA`: cuerpo superior a 64 KiB.
- `415 VALIDACION_INVALIDA`: media type no soportado.
- `503 DEPENDENCIA_NO_DISPONIBLE`: persistencia o hashing no disponible.
- `500 ERROR_INTERNO`: error no controlado.

El contrato implementado está en [`openapi.yaml`](openapi.yaml) y cubre únicamente
`POST /api/v1/buyers`, `/health` y `/ready`; no declara autenticación ni rutas de
módulos que todavía no existen. `tests/contract/openapi.test.ts` verifica rutas,
métodos, respuestas, `additionalProperties` y referencias locales del documento.

## Pruebas y compilación

```powershell
npm run typecheck
npm test
npm run build
```

Resultado registrado de esta entrega:

- `typecheck`: OK.
- `test`: 5 archivos, 29 pruebas aprobadas (unitarias, HTTP y contrato OpenAPI).
- `build`: OK.
- smoke HTTP real: `201`, `409`, `/health` y `/ready` verificados con el servidor compilado.
- PostgreSQL real: `npm run test:postgres` aprobó concurrencia con un `201` y un `409`, rollback tras un fallo posterior a las primeras escrituras y ausencia de registros parciales.
- La prueba PostgreSQL deja la base de prueba sin filas de la ejecución y conserva un registro centinela ajeno hasta comprobar la limpieza dirigida.

## PostgreSQL

1. Opción con Docker Compose (validada en este entorno):

```powershell
docker compose config
docker compose up -d
docker compose ps
```

2. Opción manual: crear una base y un usuario:

```sql
CREATE USER nexusmarket WITH PASSWORD 'nexusmarket';
CREATE DATABASE nexusmarket OWNER nexusmarket;
```

3. Configurar `.env`:

```dotenv
PERSISTENCE=postgres
DATABASE_URL=postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket
```

4. Aplicar la migración:

```powershell
npm run db:migrate
npm run dev
```

> La migración se aplica una vez por base. El script actual no mantiene una tabla de migraciones versionadas; si el volumen ya fue migrado, no la reejecutes. Para una base limpia, usa un volumen nuevo o elimina el esquema de prueba.

El adaptador PostgreSQL escribe `users`, `buyers`, `carts`, `audit_log` y `outbox` dentro de una única transacción. La migración se ejecutó correctamente contra `postgres:17-alpine` (PostgreSQL 17.11).

### Prueba automatizada de PostgreSQL

La suite de PostgreSQL no forma parte de `npm test`; se ejecuta con un script separado y una base dedicada.

1. Crear la base de prueba si no existe:

```powershell
docker compose exec -T postgres psql -U nexusmarket -d nexusmarket -Atc "SELECT 1 FROM pg_database WHERE datname='nexusmarket_test';"
# Si la salida anterior está vacía:
docker compose exec -T postgres createdb -U nexusmarket nexusmarket_test
```

2. Definir la URL y ejecutar:

```powershell
$env:TEST_DATABASE_URL = "postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket_test"
npm run test:postgres
```

La prueba:

- exige `TEST_DATABASE_URL` y **falla** si no está definida en el entorno ni en `.env`; no se omite en silencio;
- solo acepta un host local (`127.0.0.1`, `localhost` o `::1`), una base cuyo nombre termine en `_test` y ningún parámetro de query que pueda alterar esos valores;
- aplica `migrations/001_initial.sql` si la base de prueba está vacía y rechaza un esquema parcial;
- ejecuta dos altas concurrentes con el mismo correo contra PostgreSQL real y exige un `201` y un `409`;
- provoca un fallo controlado después de insertar usuario, comprador y carrito, y verifica el rollback y la ausencia de registros parciales;
- limpia únicamente los identificadores y correlaciones de la ejecución, sin `TRUNCATE`, y comprueba que un registro centinela ajeno sobrevive.

Si PostgreSQL no está disponible, el comando falla y el estado correcto es `BLOCKED`, no `PASS`.
No apuntes `TEST_DATABASE_URL` a `nexusmarket` ni a una base de desarrollo o producción: la guarda lo rechaza antes de conectar.

## Decisiones y trazabilidad

Las decisiones de implementación se registran en
[`docs/backend/implementation/01-acceptance-and-unblock.md`](../docs/backend/implementation/01-acceptance-and-unblock.md).
El caso de uso canónico es `PI-01` de
[`nexusmarket-input-ports.md`](../BackendSDD/Application/nexusmarket-input-ports.md).

La frontera `BuyerRegistrationStore` compone PO-01, PO-02, PO-07, PO-14 y PO-23 en una sola transacción para el primer vertical. No sustituye a los puertos canónicos: cuando aparezcan más casos de uso, se extraerán repositorios separados.
