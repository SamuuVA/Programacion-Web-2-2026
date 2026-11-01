# NexusMarket Backend

Primera entrega ejecutable: **`PI-01 RegisterBuyer`** y **consulta pública de catálogo (`PI-07`)** en TypeScript/Node.js.

## Alcance

Incluido:

- registro público de comprador;
- `Usuario` con rol `COMPRADOR` y estado `ACTIVO`;
- `PerfilComprador` con estado `HABILITADO` y sin direcciones;
- `Carrito` vacío, versión 1;
- hash Argon2id con parámetros `DEC-W1-008`;
- auditoría y evento de outbox en la misma transacción;
- endpoint HTTP, validación, correlación y errores uniformes;
- catálogo público de solo lectura: productos, detalle y categorías;
- modelo V1 sin variantes: cada producto tiene SKU, precio, imágenes y tipo de entrega propios;
- inventario por producto y bodega, con disponibilidad calculada;
- persistencia PostgreSQL como único adaptador de ejecución (sin almacenamiento en memoria);
- seed de demostración explícito, transaccional e idempotente;
- pruebas de contrato de las seis rutas implementadas;
- prueba de integración PostgreSQL reproducible, con concurrencia, `409`, rollback y limpieza dirigida.

Fuera de alcance:

- autenticación, sesiones y autorización;
- alta administrativa de vendedores y bodegas;
- mutaciones de catálogo, publicación, reserva o ajuste de inventario;
- carrito operativo, checkout, pedidos, pagos y devoluciones;
- subida o almacenamiento de archivos; las imágenes son rutas servidas por el frontend;
- variantes comerciales;
- frontend dentro de `backend/`; la interfaz vive en [`../frontend`](../frontend);
- Mongo para auditoría en este corte.

## Requisitos

- Node.js **24.x** (fijado en `engines`; verificado con `v24.21.0`).
- npm 11+.
- PostgreSQL 17+ (obligatorio).
- Docker es opcional si ya hay un PostgreSQL local.

## Instalación

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

No hay secretos reales en `.env.example`.

## Ejecutar en desarrollo

PostgreSQL es obligatorio. El servidor falla al arrancar si `DATABASE_URL` no
está definida: no existe un modo en memoria que pueda perder datos al reiniciar.

```powershell
docker compose up -d
npm run db:migrate
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
- `404 RECURSO_NO_ENCONTRADO`: recurso inexistente o no público (catálogo).
- `409 CONFLICTO_UNICIDAD`: correo o documento ya registrado.
- `413 VALIDACION_INVALIDA`: cuerpo superior a 64 KiB.
- `415 VALIDACION_INVALIDA`: media type no soportado.
- `503 DEPENDENCIA_NO_DISPONIBLE`: persistencia o hashing no disponible.
- `500 ERROR_INTERNO`: error no controlado.

El contrato implementado está en [`openapi.yaml`](openapi.yaml) y cubre
`POST /api/v1/buyers`, `GET /api/v1/products`, `GET /api/v1/products/{productId}`,
`GET /api/v1/categories`, `/health` y `/ready`; no declara autenticación ni rutas de
módulos que todavía no existen. `tests/contract/openapi.test.ts` verifica rutas,
métodos, respuestas, `additionalProperties` y referencias locales del documento.

## Consultar el catálogo público

El catálogo solo devuelve productos `PUBLICADO` de vendedores `ACTIVO`. En V1 no
hay variantes comerciales: cada producto es una combinación vendible independiente.

```powershell
# Listado con búsqueda, categoría, orden y paginación
curl.exe "http://127.0.0.1:3000/api/v1/products?search=lampara&categoria=HOGAR&orden=precio_asc&page=1&pageSize=6"

# Detalle
curl.exe "http://127.0.0.1:3000/api/v1/products/40000000-0000-4000-8000-000000000001"

# Categorías controladas
curl.exe "http://127.0.0.1:3000/api/v1/categories"
```

| Parámetro | Valores | Default |
|---|---|---|
| `search` | Texto de hasta 100 caracteres; insensible a mayúsculas y acentos | Sin filtro |
| `categoria` | `ELECTRONICA`, `ROPA`, `HOGAR`, `DIGITAL` | Sin filtro |
| `orden` | `recientes`, `precio_asc`, `precio_desc`, `nombre_asc` | `recientes` |
| `page` | Entero ≥ 1 | `1` |
| `pageSize` | Entero 1–48 | `12` |

Reglas:

- `disponible` suma `on_hand - reserved - unavailable` en bodegas `ACTIVA`, con mínimo 0.
- Para `tipo_entrega = 'DIGITAL'`, `disponible` es `null`.
- UUID malformado en el detalle → `400 VALIDACION_INVALIDA`.
- UUID válido inexistente, no publicado o de vendedor inactivo → `404 RECURSO_NO_ENCONTRADO`.

## Datos de demostración

El seed no se ejecuta automáticamente y no sustituye a la API: escribe en las
mismas tablas que usaría un vendedor real.

```powershell
npm run db:seed:demo
```

Crea 2 vendedores, 2 bodegas, 8 productos publicados, 8 imágenes y 6 filas de
inventario. Es idempotente (`ON CONFLICT ... DO UPDATE`) y se ejecuta en una
transacción. Los IDs de producto van de `40000000-0000-4000-8000-000000000001`
a `...-0008`. La contraseña demo se puede cambiar con `DEMO_SEED_PASSWORD`.


## Pruebas y compilación

```powershell
npm run typecheck
npm test
npm run build
```

Resultado registrado de esta entrega:

- `typecheck`: OK.
- `test`: 8 archivos, 51 pruebas aprobadas (unitarias, HTTP, catálogo y contrato OpenAPI).
- `build`: OK.
- smoke HTTP real: `201`, `409`, catálogo, detalle, `404`, `/health` y `/ready` verificados con el servidor compilado.
- PostgreSQL real: `npm run test:postgres` aprobó 3 archivos / 11 pruebas, incluidos concurrencia con un `201` y un `409`, rollback tras un fallo posterior a las primeras escrituras, ausencia de registros parciales y consultas de catálogo.
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
DATABASE_URL=postgresql://nexusmarket:nexusmarket@127.0.0.1:5432/nexusmarket
```

4. Aplicar la migración:

```powershell
npm run db:migrate
npm run dev
```

> El runner mantiene `schema_migrations`, aplica cada archivo una sola vez, valida checksums y usa un advisory lock. `npm run db:migrate:baseline` solo debe usarse sobre una base existente ya verificada.

El adaptador PostgreSQL escribe `users`, `buyers`, `carts`, `audit_log` y `outbox` dentro de una única transacción. La migración de catálogo (`003_catalog.sql`) añade `sellers`, `warehouses`, `products`, `product_images` e `inventory`. Las migraciones se ejecutaron correctamente contra `postgres:17-alpine` (PostgreSQL 17.11).

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
- aplica las migraciones versionadas (`001`–`003`) si la base de prueba está vacía y rechaza un esquema parcial;
- ejecuta dos altas concurrentes con el mismo correo contra PostgreSQL real y exige un `201` y un `409`;
- provoca un fallo controlado después de insertar usuario, comprador y carrito, y verifica el rollback y la ausencia de registros parciales;
- limpia únicamente los identificadores y correlaciones de la ejecución, sin `TRUNCATE`, y comprueba que un registro centinela ajeno sobrevive.

Si PostgreSQL no está disponible, el comando falla y el estado correcto es `BLOCKED`, no `PASS`.
No apuntes `TEST_DATABASE_URL` a `nexusmarket` ni a una base de desarrollo o producción: la guarda lo rechaza antes de conectar.

## Decisiones y trazabilidad

Las decisiones de esta entrega se registran en
[`docs/implementation/DECISIONS-LOG.md`](../docs/implementation/DECISIONS-LOG.md).
El estado verificable está en
[`docs/implementation/IMPLEMENTATION-STATUS.md`](../docs/implementation/IMPLEMENTATION-STATUS.md)
y el contrato en [`docs/implementation/API-CONTRACT-STATUS.md`](../docs/implementation/API-CONTRACT-STATUS.md).
El informe histórico de aceptación de `PI-01` sigue en
[`docs/backend/implementation/01-acceptance-and-unblock.md`](../docs/backend/implementation/01-acceptance-and-unblock.md).
El caso de uso canónico es `PI-01` de
[`nexusmarket-input-ports.md`](../BackendSDD/Application/nexusmarket-input-ports.md).

La frontera `BuyerRegistrationStore` compone PO-01, PO-02, PO-07, PO-14 y PO-23 en una sola transacción para el primer vertical. No sustituye a los puertos canónicos: cuando aparezcan más casos de uso, se extraerán repositorios separados. El catálogo usa un puerto de lectura separado (`CatalogQueryRepository`) porque no muta estado ni comparte transacción con el registro.
