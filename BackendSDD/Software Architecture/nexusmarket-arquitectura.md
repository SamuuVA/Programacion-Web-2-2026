# NexusMarket — Arquitectura de software con TypeScript, Node.js, SQL, MongoDB y Docker

**Versión:** 1.0  
**Estado:** propuesta arquitectónica adaptada para el proyecto  
**Referencia funcional:** `nexusmarket-domain-model.md`

---

## 1. Propósito

Este documento adapta la arquitectura inicialmente planteada en Go a la pila tecnológica definida para NexusMarket:

- **TypeScript** como lenguaje del backend.
- **Node.js** como entorno de ejecución.
- **SQL**, con **PostgreSQL recomendado como motor relacional inicial**.
- **MongoDB** para necesidades documentales concretas que justifiquen una base NoSQL.
- **Docker** para empaquetar y ejecutar los componentes del entorno de desarrollo y despliegue.
- **Domain-Driven Design (DDD)** para modelar el negocio y sus límites.
- **Arquitectura hexagonal (Ports & Adapters)** para aislar el dominio de HTTP, las bases de datos y los proveedores externos.
- **SOLID**, separación de responsabilidades, pruebas automatizadas y dependencias dirigidas hacia el núcleo.

La arquitectura se plantea inicialmente como un **monolito modular**: una aplicación backend desplegable como una unidad, organizada en módulos de negocio con límites explícitos. DDD no exige microservicios y, para la primera versión, el monolito modular reduce la complejidad operativa y distribuida. Los módulos deben diseñarse de modo que puedan separarse en el futuro si existe una necesidad real.

## 2. Alcance y criterios de interpretación

El diseño contempla las capacidades funcionales identificadas en el SDD:

- Identidad, usuarios y roles.
- Compradores y vendedores.
- Bodegas.
- Catálogo de productos y variantes.
- Inventario y reservas.
- Carrito y compra.
- Pedidos.
- Pagos.
- Facturación.
- Envíos y logística.
- Devoluciones y reembolsos.
- Administración y reportes.

El SDD distingue requisitos expresos de propuestas de modelado y señala comportamientos que aún no están definidos por negocio. Esta arquitectura **no convierte esos vacíos en reglas aprobadas**. Cuando se propone una solución técnica para poder avanzar, se identifica como recomendación y no como requisito funcional confirmado.

### 2.1 Decisiones tecnológicas adoptadas para esta propuesta

| Área | Decisión |
|---|---|
| Lenguaje | TypeScript con `strict: true` |
| Runtime | Node.js en una versión LTS soportada y fijada por el proyecto |
| HTTP | API REST; Fastify es una opción recomendada por su enfoque ligero. Express también sería viable, pero no se deben mezclar frameworks |
| Contrato de API | OpenAPI |
| Base relacional | PostgreSQL recomendado para datos relacionales y transacciones |
| Base documental | MongoDB, solo para colecciones con una responsabilidad documentada |
| Persistencia SQL | Un adaptador/repositorio SQL detrás de puertos; ORM o query builder a seleccionar antes de implementarlo |
| Persistencia MongoDB | Driver oficial o biblioteca compatible, confinada al adaptador MongoDB |
| Contenedores | Docker y Docker Compose para desarrollo local |
| Pruebas | Vitest o Jest; pruebas de integración contra servicios reales de prueba |
| Validación de entrada | Biblioteca de esquemas como Zod, aplicada en los límites HTTP |
| Registro y configuración | Logger estructurado, variables de entorno validadas y secretos fuera del repositorio |

Estas elecciones no obligan a incorporar todas las bibliotecas desde el primer día. Las dependencias definitivas deben quedar fijadas en el manifiesto del proyecto y verificadas mediante pruebas y revisión técnica.

### 2.2 Principios no negociables

1. El dominio no importa Node.js, Fastify/Express, drivers SQL, MongoDB ni SDKs de terceros.
2. Los casos de uso no ejecutan consultas SQL ni acceden directamente a colecciones MongoDB.
3. Los adaptadores implementan puertos definidos por sus consumidores.
4. La autorización considera el rol **y** la propiedad/alcance del recurso.
5. SQL y MongoDB no deben convertirse en dos fuentes de verdad para la misma entidad operativa.
6. Los cambios de estado se realizan mediante comportamientos de dominio y transiciones válidas.
7. La infraestructura no sustituye las reglas del dominio.
8. No se crean paquetes vacíos, interfaces especulativas ni microservicios solo por anticipación.

---

## 3. Estilo arquitectónico y vista de capas

Se adopta una combinación de DDD, arquitectura hexagonal y monolito modular.

```text
Clientes / actores
        |
        v
Adaptador de entrada HTTP
(rutas, middleware, handlers, DTOs)
        |
        v
Puertos de entrada / casos de uso
        |
        v
Capa de aplicación
(orquestación, autorización, transacciones)
        |
        +----------------------+
        |                      |
        v                      v
Dominio                  Puertos de salida
(entidades, VOs,                |
agregados, reglas)              v
                         Adaptadores de salida
                         /         |          \
                        v          v           v
                  PostgreSQL    MongoDB    Proveedores
                  / SQL         documental externos
```

### 3.1 Dominio

Contiene entidades, agregados, objetos de valor, reglas, transiciones y errores de negocio. No conoce el transporte ni el almacenamiento.

### 3.2 Aplicación

Implementa los casos de uso y coordina dominio, autorización, repositorios y transacciones. Decide el orden de las operaciones, pero no duplica las reglas que pertenecen al dominio.

### 3.3 Adaptadores de entrada

Traducen peticiones HTTP a comandos/consultas de aplicación y convierten resultados y errores en respuestas HTTP. No contienen reglas de negocio ni acceden directamente a las bases de datos.

### 3.4 Adaptadores de salida

Implementan puertos para SQL, MongoDB y posibles servicios externos. Traducen los modelos de persistencia al modelo de dominio y viceversa.

### 3.5 Infraestructura y composición

Carga configuración, crea conexiones, construye adaptadores y casos de uso y arranca el servidor. El punto de composición es el lugar donde se conocen las implementaciones concretas.

---

## 4. Organización del repositorio

Estructura inicial recomendada:

```text
nexusmarket/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── composition/
│   │   └── container.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── config.ts
│   ├── shared/
│   │   ├── application/
│   │   │   ├── errors/
│   │   │   └── ports/
│   │   ├── domain/
│   │   │   ├── errors/
│   │   │   └── identifiers/
│   │   └── infrastructure/
│   │       ├── logging/
│   │       └── observability/
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── adapters/
│   │   │   │   ├── http/
│   │   │   │   └── persistence/
│   │   │   └── index.ts
│   │   ├── buyers/
│   │   ├── sellers/
│   │   ├── warehouses/
│   │   ├── catalog/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── billing/
│   │   ├── shipping/
│   │   ├── returns/
│   │   ├── refunds/
│   │   └── reporting/
│   └── infrastructure/
│       ├── http/
│       │   ├── server.ts
│       │   ├── router.ts
│       │   ├── middleware/
│       │   └── error-handler.ts
│       ├── persistence/
│       │   ├── sql/
│       │   │   ├── connection.ts
│       │   │   ├── migrations/
│       │   │   └── transaction-manager.ts
│       │   └── mongodb/
│       │       ├── connection.ts
│       │       └── collections/
│       └── integrations/
│           ├── payments/
│           ├── shipping/
│           ├── messaging/
│           └── files/
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/
│   └── architecture/
├── api/
│   └── openapi.yaml
├── docker/
│   └── api.Dockerfile
├── compose.yaml
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env.example
├── .dockerignore
├── .gitignore
└── README.md
```

### 4.1 Estructura interna de cada módulo

Un módulo de negocio mantiene las capas que realmente necesita:

```text
modules/catalog/
├── domain/
│   ├── product.ts
│   ├── product-id.ts
│   ├── product-status.ts
│   ├── product-repository.ts
│   ├── product-policy.ts
│   └── errors.ts
├── application/
│   ├── commands/
│   ├── queries/
│   ├── use-cases/
│   └── ports/
├── adapters/
│   ├── http/
│   │   ├── product-routes.ts
│   │   ├── product-schemas.ts
│   │   └── product-mapper.ts
│   └── persistence/
│       └── sql-product-repository.ts
└── index.ts
```

Los nombres son ilustrativos. No es obligatorio crear todos los archivos desde el inicio. Un módulo debe exportar solo las capacidades que otros módulos necesitan, evitando que accedan a sus detalles internos.

### 4.2 Organización por módulo, no por carpetas globales de tipo

Se recomienda agrupar primero por contexto de negocio y después por capa. Esto facilita mantener juntos el modelo, los casos de uso y los adaptadores de cada capacidad. `shared/` debe reservarse para elementos realmente compartidos y estables; no debe convertirse en una carpeta general de utilidades.

---

## 5. Módulos de dominio y límites iniciales

Los siguientes módulos derivan de las capacidades del SDD. Son límites lógicos dentro de la aplicación, no microservicios independientes por defecto.

| Módulo | Responsabilidad principal |
|---|---|
| `identity` | Usuario, rol, estado de cuenta e identidad operativa |
| `buyers` | Perfil de comprador, direcciones y estado comercial |
| `sellers` | Incorporación administrativa y perfil comercial del vendedor |
| `warehouses` | Datos y clasificación de bodegas |
| `catalog` | Productos, variantes y estados de publicación |
| `inventory` | Existencias por producto/bodega, reservas y movimientos |
| `cart` | Selección provisional de productos y cantidades |
| `orders` | Pedido y ciclo de vida comercial |
| `payments` | Registro y coordinación del resultado de pago |
| `billing` | Facturas y datos de facturación |
| `shipping` | Preparación, despacho, transporte y entrega |
| `returns` | Solicitudes y evaluación de devoluciones |
| `refunds` | Solicitudes, autorización y seguimiento de reembolsos |
| `reporting` | Consultas e indicadores de lectura para perfiles autorizados |

### 5.1 Usuario, comprador y vendedor

Se conserva la distinción arquitectónica del documento base: `User` representa identidad y autorización; `Buyer` y `Seller` representan perfiles comerciales separados, relacionados con la cuenta cuando corresponda.

El SDD establece un único rol por usuario, pero no resuelve por completo la cardinalidad entre la cuenta y los perfiles. La implementación debe respetar la regla confirmada de un rol por usuario y no permitir que una misma cuenta acumule roles incompatibles por una decisión técnica implícita. La relación definitiva debe validarse contra la especificación funcional.

### 5.2 Agregados e invariantes

Los límites definitivos de agregados deben surgir del modelo DDD y de sus invariantes. Como orientación inicial:

- `User`: identidad, correo, rol y estado.
- `Buyer`: datos propios del comprador y sus reglas.
- `Seller`: datos comerciales y estado, una vez definidos.
- `Product`: datos del producto, variantes y transiciones de publicación según las reglas aprobadas.
- `InventoryItem` o `StockByWarehouse`: existencias de un producto en una bodega.
- `Cart`: selección provisional y líneas.
- `Order`: líneas confirmadas y estado comercial.
- `Payment`, `Invoice`, `Shipment`, `ReturnRequest` y `Refund`: conceptos potencialmente identificables y con ciclo de vida propio.

La lista es una hipótesis de diseño inicial, no una obligación de crear una clase o tabla por concepto. Un agregado debe proteger una regla de consistencia concreta. No se deben cargar agregados grandes ni intentar actualizar todos los contextos en una única transacción global.

---

## 6. Capa de dominio en TypeScript

### 6.1 Contenido permitido

- Entidades y raíces de agregado.
- Objetos de valor inmutables.
- Identificadores de dominio.
- Tipos de estado y categorías controladas.
- Servicios de dominio cuando una regla no pertenezca naturalmente a una entidad.
- Errores de dominio.
- Interfaces de repositorio cuando el modelo de dominio o la aplicación las necesite.

### 6.2 Contenido prohibido

El dominio no debe importar:

- `fastify`, `express` ni objetos `Request`/`Response`.
- `pg`, ORM, query builders o tipos de SQL.
- Driver de MongoDB o documentos BSON.
- SDKs de pasarelas de pago, operadores logísticos o mensajería.
- DTOs HTTP, variables de entorno o configuración Docker.

### 6.3 TypeScript estricto

`tsconfig.json` debe activar como mínimo `strict: true`. Se deben evitar `any` y conversiones de tipo que oculten errores. Los tipos de dominio deben expresar estados válidos y no depender exclusivamente de validaciones en la interfaz.

Ejemplo ilustrativo de un objeto de valor:

```ts
export class EmailAddress {
  private constructor(readonly value: string) {}

  static create(raw: string): EmailAddress {
    const value = raw.trim().toLowerCase();

    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error("Invalid email address");
    }

    return new EmailAddress(value);
  }
}
```

Este ejemplo muestra encapsulación y validación básica, pero no define por sí solo una política completa de correo. La unicidad debe garantizarse también mediante una restricción de persistencia y un tratamiento explícito de conflictos. El tipo de error mostrado es demostrativo; en la implementación se recomienda un error de dominio específico.

### 6.4 Reglas de negocio prioritarias derivadas del SDD

- El correo del usuario debe ser único.
- Cada usuario tiene un único rol.
- Las operaciones requieren identidad autenticada y autorización.
- No se permiten existencias negativas.
- No se reserva inventario inexistente ni marcado como dañado.
- Los movimientos de inventario deben distinguirse de los estados del inventario.
- Los estados de pedido solo cambian mediante transiciones permitidas.
- Un pedido finalizado no puede modificarse; las devoluciones y los reembolsos deben tramitarse como procesos separados.
- Los productos físicos requieren inventario y despacho; los digitales siguen el flujo de entrega definido para ellos.
- El vendedor solo administra recursos que pertenecen a su ámbito autorizado.

El SDD no define todas las transiciones, los estados excepcionales ni las políticas de reintento. No se deben inventar esos flujos en el código sin una decisión funcional explícita.

---

## 7. Capa de aplicación: casos de uso y puertos

### 7.1 Responsabilidad

La aplicación coordina cada operación de negocio:

1. Recibe un comando o consulta.
2. Verifica la identidad y la autorización requeridas.
3. Recupera las entidades mediante puertos de salida.
4. Invoca el comportamiento del dominio.
5. Coordina la transacción cuando corresponde.
6. Persiste los cambios y solicita integraciones externas mediante puertos.
7. Devuelve un resultado de aplicación o un error significativo.

Los casos de uso no deben contener SQL, consultas MongoDB ni reglas de negocio duplicadas.

### 7.2 Puertos de entrada

Ejemplos de capacidades:

- `RegisterSeller`
- `RegisterBuyer`
- `CreateProduct`
- `PublishProduct`
- `AdjustInventory`
- `ReserveInventory`
- `AddCartItem`
- `Checkout`
- `ConfirmPayment`
- `DispatchOrder`
- `RequestReturn`
- `ProcessRefund`
- `GenerateAdministrativeReport`

Son nombres candidatos que deben alinearse con los casos de uso aprobados. Cada caso de uso puede ser una clase o función TypeScript. No es obligatorio crear una interfaz por clase si no aporta desacoplamiento útil.

### 7.3 Puertos de salida

Ejemplos:

- `UserRepository`
- `SellerRepository`
- `ProductRepository`
- `InventoryRepository`
- `CartRepository`
- `OrderRepository`
- `PaymentRepository`
- `InvoiceRepository`
- `ShipmentRepository`
- `ReturnRepository`
- `RefundRepository`
- `AuditLogRepository`
- `TransactionManager`
- `PaymentGateway`
- `ShippingProvider`
- `NotificationSender`

Las interfaces deben expresar necesidades reales. No se debe crear un repositorio universal para todas las entidades ni exponer tipos de persistencia en las firmas de los puertos.

Ejemplo conceptual:

```ts
export interface ProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<void>;
}
```

La firma es ilustrativa. El contrato definitivo debe contemplar concurrencia, conflictos de unicidad, paginación y los requisitos de consulta del caso de uso.

---

## 8. Adaptador HTTP y contrato de API

### 8.1 Responsabilidades

- Registrar rutas y middleware.
- Validar forma y tipos de las solicitudes.
- Convertir DTOs a comandos/consultas de aplicación.
- Invocar puertos de entrada.
- Mapear resultados a respuestas públicas.
- Traducir errores de dominio/aplicación a códigos HTTP estables.
- Aplicar límites transversales: tamaño de petición, correlación, límites de tasa cuando se definan y observabilidad.

Los handlers no deben contener reglas de negocio ni consultar repositorios concretos.

### 8.2 Validación y DTOs

Los DTOs HTTP son distintos de las entidades de dominio y de los registros de persistencia. Se recomienda validar la estructura de entrada con un esquema en el borde HTTP. Las invariantes de negocio deben volver a protegerse dentro del dominio, pues el caso de uso puede invocarse desde otros adaptadores.

### 8.3 Errores HTTP

Se recomienda un formato uniforme de error con:

- Código estable de error.
- Mensaje seguro para el cliente.
- Identificador de correlación.
- Detalles de validación cuando proceda, sin revelar datos sensibles.

Los errores internos de SQL, MongoDB o proveedores no se devuelven directamente al cliente. El manejador global traduce errores conocidos a respuestas HTTP y registra detalles técnicos en los logs protegidos.

### 8.4 Contrato OpenAPI

Mantener el contrato en `api/openapi.yaml`. Debe documentar rutas, parámetros, esquemas, respuestas, códigos de error, autenticación y versionado. El contrato debe evolucionar junto con las pruebas de API; no sustituye a las reglas del dominio.

---

## 9. Persistencia: SQL y MongoDB con responsabilidades distintas

La presencia de dos tecnologías de almacenamiento requiere definir claramente la propiedad de los datos. Esta propuesta recomienda **PostgreSQL como fuente principal de verdad de los datos transaccionales** y MongoDB para casos documentales o de auditoría que realmente lo requieran.

### 9.1 PostgreSQL / SQL

PostgreSQL se recomienda inicialmente para los datos con relaciones, restricciones e invariantes transaccionales:

- Usuarios y roles.
- Perfiles de compradores y vendedores.
- Bodegas.
- Productos y variantes cuando se requieran relaciones y restricciones.
- Inventario, movimientos y reservas.
- Carritos, si se decide persistirlos en SQL.
- Pedidos y sus líneas.
- Registros de pagos y facturación.
- Envíos, devoluciones y reembolsos, según el modelo definitivo.

La asignación exacta de cada entidad a SQL debe validarse con el modelo de dominio y los requisitos de consulta. La recomendación se basa en la necesidad de integridad referencial y transacciones, no en que todas las entidades deban almacenarse obligatoriamente en tablas.

### 9.2 MongoDB

MongoDB puede utilizarse para:

- Eventos o registros de auditoría con estructura documental.
- Documentos de integración externos cuyo esquema cambie con frecuencia.
- Proyecciones de lectura desnormalizadas si existe una necesidad de consulta concreta.
- Metadatos flexibles que no deban participar en invariantes transaccionales centrales.

No se debe usar MongoDB simplemente porque el sistema es un marketplace. Tampoco se recomienda duplicar pedidos, inventario o pagos en MongoDB sin una estrategia explícita de sincronización, consistencia, reparación y propiedad del dato.

Si MongoDB almacena una proyección derivada de SQL, esa proyección debe considerarse reconstruible y no una fuente de verdad. La aplicación debe tolerar retrasos de actualización si se opta por consistencia eventual.

### 9.3 Repositorios y adaptadores

Los puertos de repositorio se definen en la capa consumidora; las implementaciones viven en los adaptadores de persistencia. Ejemplos:

```text
modules/catalog/
  domain/product-repository.ts
  adapters/persistence/sql-product-repository.ts

modules/identity/
  domain/user-repository.ts
  adapters/persistence/sql-user-repository.ts

modules/reporting/
  application/ports/audit-log-reader.ts
  adapters/persistence/mongodb-audit-log-repository.ts
```

El ejemplo de auditoría en MongoDB no obliga a que todos los reportes se construyan desde esa base. Los reportes pueden leer de SQL, MongoDB o una combinación controlada según el caso de uso.

### 9.4 Transacciones y consistencia

- Las operaciones que actualizan varios registros SQL relacionados deben usar una transacción SQL.
- Una transacción SQL no cubre automáticamente MongoDB ni un proveedor externo.
- No se debe intentar mantener una transacción distribuida entre SQL, MongoDB y servicios externos sin una necesidad y estrategia explícitas.
- Para flujos que atraviesan módulos, definir límites de consistencia, estados intermedios, idempotencia y recuperación ante fallos.
- Si se adopta publicación de eventos confiable desde SQL, considerar el patrón **Transactional Outbox**: guardar el cambio de negocio y el evento pendiente en la misma transacción, y publicar después mediante un proceso idempotente.
- Las restricciones de unicidad y las operaciones atómicas de inventario deben protegerse también en la base de datos. Una comprobación previa en código no basta ante concurrencia.
- La política exacta de reserva, expiración, liberación y descuento de inventario debe acordarse antes de implementar el flujo completo de compra.

### 9.5 Migraciones y cambios de esquema

Las migraciones SQL deben versionarse y ejecutarse de manera controlada. Para MongoDB, versionar los cambios de esquema/documento y planificar compatibilidad entre versiones. No ejecutar migraciones destructivas automáticamente al iniciar cada réplica de la API en producción.

---

## 10. Docker y entorno local

### 10.1 Objetivos

Docker debe proporcionar un entorno reproducible para la API y las bases de datos. Docker Compose facilita levantar los servicios localmente, pero no implica que producción deba ejecutarse necesariamente con Compose.

Servicios locales esperados:

- `api`: backend Node.js/TypeScript.
- `postgres`: base relacional.
- `mongodb`: base documental.
- Opcionalmente, una interfaz administrativa de base de datos solo para desarrollo y nunca expuesta públicamente en producción.

### 10.2 Ejemplo inicial de `compose.yaml`

El siguiente archivo es una plantilla de desarrollo. Antes de utilizarla en producción se deben definir secretos, persistencia, redes, copias de seguridad, actualizaciones y controles de acceso.

```yaml
services:
  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    env_file:
      - .env
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_healthy
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://nexusmarket:local_dev_password@postgres:5432/nexusmarket
      MONGODB_URI: mongodb://mongodb:27017/nexusmarket
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - nexusmarket-network

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nexusmarket
      POSTGRES_USER: nexusmarket
      POSTGRES_PASSWORD: local_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexusmarket -d nexusmarket"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - nexusmarket-network

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - nexusmarket-network

volumes:
  postgres_data:
  mongodb_data:

networks:
  nexusmarket-network:
    driver: bridge
```

**Advertencia:** las contraseñas del ejemplo son exclusivamente locales y no deben reutilizarse en entornos compartidos o de producción. El archivo definitivo debe evitar contraseñas codificadas en el YAML, configurar autenticación de MongoDB y aplicar una política explícita de secretos. Los puertos de las bases de datos se pueden omitir del host cuando solo la API deba acceder a ellas.

Las versiones de imagen son ejemplos fijados para reproducibilidad inicial; antes de adoptar la configuración se deben verificar versiones mantenidas, compatibilidad y política de actualización.

### 10.3 Ejemplo de `docker/api.Dockerfile`

```dockerfile
FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

Este Dockerfile es apropiado solo como punto de partida para desarrollo. Para producción se recomienda un Dockerfile multi-stage: compilar TypeScript, instalar solo dependencias de producción en la imagen final, ejecutar como usuario no privilegiado y arrancar el JavaScript compilado. La versión de Node debe ajustarse a la versión LTS aprobada y fijarse mediante la política del proyecto.

### 10.4 Reglas de contenedorización

- Añadir `.dockerignore` para excluir `node_modules`, `.git`, artefactos, cobertura, `.env` y archivos locales innecesarios.
- No copiar secretos a la imagen.
- Persistir datos de bases de datos mediante volúmenes en desarrollo.
- Usar nombres DNS de servicio (`postgres`, `mongodb`) dentro de la red de Compose; `localhost` dentro del contenedor de la API apunta al propio contenedor.
- Añadir endpoints de salud de la API y comprobaciones de salud de dependencias.
- En producción, usar un gestor de secretos y almacenamiento persistente administrado cuando corresponda.
- Definir backups y pruebas de restauración; un volumen Docker no es por sí solo una estrategia de backup.
- No publicar puertos de base de datos a Internet.

### 10.5 Comandos locales previstos

```bash
docker compose up --build
docker compose down
docker compose logs -f api
npm run test
npm run test:integration
npm run lint
npm run build
```

Los comandos exactos deben coincidir con los scripts definidos en `package.json`.

---

## 11. Configuración, seguridad y autorización

### 11.1 Configuración

- Validar las variables de entorno al iniciar el proceso y fallar temprano si falta una configuración obligatoria.
- Mantener `.env.example` con nombres de variables y valores ficticios.
- No versionar `.env`, tokens, claves ni contraseñas.
- Separar configuración de desarrollo, pruebas y producción.
- No importar configuración global dentro del dominio; inyectar únicamente las dependencias necesarias.

Variables posibles:

```text
NODE_ENV=
PORT=
DATABASE_URL=
MONGODB_URI=
LOG_LEVEL=
AUTH_ISSUER=
AUTH_AUDIENCE=
```

Los nombres y valores definitivos dependen de la solución de autenticación elegida. No se presupone un proveedor de identidad ni un mecanismo específico de tokens.

### 11.2 Autenticación y autorización

El SDD establece que las operaciones requieren un usuario autenticado, pero no define el mecanismo técnico. La implementación deberá seleccionar y documentar la estrategia de autenticación antes de exponer operaciones protegidas.

La autorización debe comprobar:

1. Identidad autenticada.
2. Rol asignado.
3. Permiso para la operación.
4. Alcance sobre el recurso concreto.
5. Estado operativo de la cuenta, cuando corresponda.

Por ejemplo, un vendedor no debe poder modificar productos de otro vendedor solo por tener el rol `VENDEDOR`. El middleware puede validar la petición e identificar al usuario; el caso de uso debe garantizar la autorización necesaria incluso si es invocado por otro adaptador.

### 11.3 Controles de seguridad mínimos

- Validación de entradas y límites de tamaño.
- Consultas parametrizadas y protección contra inyección.
- Manejo de secretos fuera del repositorio.
- Política de CORS y límites de tasa cuando los requisitos de exposición lo determinen.
- Logs sin contraseñas, tokens ni datos sensibles innecesarios.
- Principio de mínimo privilegio para usuarios SQL, MongoDB y procesos.
- Dependencias revisadas y actualizadas.
- Errores externos sin stack traces ni detalles internos.
- Auditoría de acciones administrativas sensibles, con acceso y retención definidos.
- Copias de seguridad y procedimientos de restauración comprobados.

---

## 12. Flujos transaccionales críticos

La arquitectura debe reconocer que los flujos de negocio pueden cruzar módulos y sistemas externos.

### 12.1 Compra, pedido, inventario y pago

El SDD indica que el comprador confirma la compra, se valida el pago y esa validación inicia la preparación. No define por completo el orden técnico entre crear el pedido, reservar inventario y autorizar/capturar el pago, ni el tratamiento de fallos.

Por tanto, antes de implementar el checkout se debe especificar un flujo que incluya como mínimo:

- Qué operación crea el pedido y en qué estado.
- Cuándo se reserva inventario y cómo se evita una reserva doble.
- Cómo se identifica una solicitud repetida del mismo checkout.
- Qué ocurre si no hay inventario suficiente.
- Qué ocurre si el proveedor de pago falla o responde tarde.
- Cómo se libera una reserva si la compra no continúa.
- Cómo se reconcilian respuestas tardías o contradictorias del proveedor.
- Cuándo se permite iniciar la preparación.
- Qué datos comerciales quedan congelados en el pedido para preservar el historial.

La decisión final puede usar una secuencia síncrona para parte del proceso y estados/eventos para las operaciones externas. No se debe afirmar que una transacción SQL vuelve atómico el flujo completo entre inventario, pasarela de pago y logística.

### 12.2 Idempotencia y concurrencia

Operaciones sensibles como confirmar una compra, registrar una confirmación de pago, reservar inventario o procesar un reembolso deben diseñarse para reconocer solicitudes duplicadas. La estrategia concreta —clave de idempotencia, restricciones únicas, control optimista/pesimista o una combinación— depende del caso de uso.

### 12.3 Eventos y consistencia eventual

No se requiere incorporar un broker de mensajes desde el primer día sin una necesidad identificada. Si los módulos deben reaccionar de forma asíncrona o publicar eventos de manera fiable, evaluar un outbox transaccional y un publicador idempotente. La entrega de eventos puede repetirse; los consumidores deben tolerar duplicados.

---

## 13. Pruebas y calidad

### 13.1 Pruebas unitarias de dominio

Verifican reglas, invariantes y transiciones sin iniciar HTTP ni bases de datos. Casos prioritarios:

- Correo no vacío y unicidad aplicada por persistencia.
- Un usuario tiene un único rol.
- No se reserva inventario inexistente o dañado.
- Las existencias no quedan negativas.
- Solo se permiten transiciones de pedido válidas.
- Un pedido finalizado no se modifica.
- La autorización por recurso se respeta.

### 13.2 Pruebas de aplicación

Usan dobles de los puertos de salida y verifican la orquestación: orden de llamadas, errores, permisos, persistencia y tratamiento de resultados externos.

### 13.3 Pruebas de integración

Verifican adaptadores contra PostgreSQL y MongoDB reales de prueba, incluyendo migraciones, restricciones, consultas, índices y manejo de conflictos. Docker Compose puede proporcionar las dependencias para estas pruebas.

### 13.4 Pruebas end-to-end

Verifican flujos HTTP completos desde la API hasta las dependencias de prueba. Deben cubrir casos válidos, errores de validación, autorización, conflictos y fallos de dependencias.

### 13.5 Automatización

El pipeline debe ejecutar al menos:

1. Instalación reproducible (`npm ci`).
2. Formateo/lint.
3. Comprobación de tipos (`tsc --noEmit`).
4. Pruebas unitarias.
5. Pruebas de integración en un entorno controlado.
6. Build de producción.
7. Construcción de la imagen Docker y comprobaciones de seguridad acordadas.

---

## 14. Observabilidad y operación

La aplicación debe generar logs estructurados con identificador de correlación, nivel, contexto operativo y errores relevantes. No debe registrar secretos ni información personal innecesaria.

Métricas y verificaciones recomendadas:

- Disponibilidad y latencia HTTP.
- Tasas de error por ruta/caso de uso.
- Conexiones y errores de SQL/MongoDB.
- Fallos de integración externa.
- Reintentos y operaciones idempotentes duplicadas.
- Reservas pendientes o expiradas, cuando esa política se defina.
- Eventos pendientes de publicación, si se adopta outbox.

Las trazas distribuidas completas no son requisito inicial del monolito, pero la instrumentación debe permitir incorporarlas si la complejidad operacional lo justifica.

---

## 15. Convenciones de implementación TypeScript

- Activar `strict: true` y evitar `any`.
- Usar `async/await` y propagar errores de forma explícita.
- Mantener los tipos de dominio independientes de los tipos de framework y persistencia.
- Usar identificadores semánticos (`UserId`, `ProductId`, `OrderId`) cuando ayuden a evitar confusiones.
- Mantener interfaces pequeñas, orientadas al consumidor.
- No crear clases solo para envolver una función sin aportar encapsulación o una frontera útil.
- No usar un contenedor de dependencias complejo si la composición manual es suficiente.
- No colocar reglas de negocio en controladores, validadores HTTP, ORM hooks o triggers como única protección.
- Mantener mapeadores explícitos entre dominio, DTOs y persistencia.
- Evitar un módulo `utils` o `common` que acumule responsabilidades sin relación.
- Mantener las dependencias actualizadas y fijar versiones mediante el lockfile.

---

## 16. Reglas de dependencia

1. `domain` no depende de `application`, `adapters` ni `infrastructure`.
2. `application` puede depender de `domain` y de los puertos que utiliza; no de adaptadores concretos.
3. Los adaptadores HTTP dependen de puertos de entrada.
4. Los adaptadores SQL/MongoDB implementan puertos de salida.
5. Los DTOs HTTP y modelos de persistencia no entran en el dominio.
6. Los casos de uso no ejecutan consultas directamente.
7. El punto de composición construye las dependencias concretas.
8. Los permisos se verifican por rol y recurso.
9. Los errores de infraestructura se traducen en límites de adaptador.
10. SQL y MongoDB tienen propiedad de datos definida; no se duplica la fuente de verdad sin estrategia.
11. Los cambios de estado se realizan mediante comportamientos del dominio.
12. Las transacciones se limitan a la frontera que realmente pueden garantizar.
13. Las integraciones externas deben considerar idempotencia, tiempos de espera, reintentos y fallos parciales.
14. La arquitectura debe reflejar límites de negocio, no únicamente tipos de archivo.

---

## 17. Orden recomendado de implementación

1. Confirmar el modelo de dominio, roles, permisos, estados y reglas críticas del SDD.
2. Aprobar la responsabilidad de SQL y MongoDB y documentar la propiedad de cada dato.
3. Seleccionar framework HTTP, estrategia de persistencia SQL, driver MongoDB y herramientas de prueba.
4. Crear el esqueleto TypeScript, configuración estricta, lint y scripts.
5. Crear Docker Compose de desarrollo y comprobar conexiones saludables.
6. Implementar un módulo vertical acotado con dominio, caso de uso, puerto y pruebas.
7. Implementar su adaptador SQL y pruebas de integración.
8. Exponer el caso de uso mediante HTTP y documentarlo en OpenAPI.
9. Añadir autenticación y autorización por recurso antes de habilitar operaciones protegidas.
10. Diseñar y probar las invariantes de inventario y el flujo de checkout antes de integrar pagos reales.
11. Incorporar MongoDB cuando exista un caso de uso concreto para documentos/auditoría.
12. Añadir integraciones externas con idempotencia y manejo de fallos.
13. Automatizar pruebas y construcción de imagen en CI.
14. Definir despliegue, backups, restauración, observabilidad y gestión de secretos para el entorno objetivo.

Se recomienda comenzar con un flujo vertical pequeño y verificable, no creando todas las carpetas y archivos vacíos. La selección del primer caso de uso debe respetar las dependencias reales del negocio.

---

## 18. Decisiones que aún requieren validación

Este documento concreta una arquitectura técnica, pero no reemplaza las decisiones funcionales que corresponden al negocio.

### Tecnología y operación

- Confirmar PostgreSQL como motor SQL o elegir otro motor relacional.
- Elegir Fastify o Express y fijar la versión de Node.js y TypeScript.
- Elegir ORM/query builder o estrategia SQL directa.
- Definir el mecanismo de autenticación y gestión de credenciales.
- Definir entornos de despliegue, secretos, backups, restauración y monitorización.
- Confirmar qué datos concretos se almacenarán en MongoDB y qué módulo es dueño de ellos.

### Dominio y consistencia

- Resolver la relación definitiva entre usuario, comprador y vendedor.
- Aprobar atributos obligatorios y estados de vendedor, bodega y comprador.
- Definir variantes, precio, moneda, impuestos y condiciones de publicación de productos.
- Definir cantidades de inventario, reservas, expiración, liberación y ajustes.
- Aprobar estados y transiciones de pedido, incluidos fallos, cancelación y entrega fallida.
- Definir el orden de reserva, pago y preparación y el tratamiento de fallos parciales.
- Definir la cardinalidad entre pedidos, facturas y envíos.
- Definir devoluciones y reembolsos parciales, autorizaciones y relación con pagos/facturas.
- Definir los reportes, permisos de consulta, auditoría y retención.

Estos puntos no se consideran resueltos por la elección de TypeScript, SQL, MongoDB o Docker. Deben cerrarse en el modelado del dominio o aceptarse formalmente como fuera del alcance de la primera versión.

---

## 19. Criterios de aceptación de la arquitectura

La arquitectura puede considerarse preparada para iniciar la implementación cuando:

1. El proyecto compila en TypeScript estricto.
2. Los límites entre dominio, aplicación y adaptadores están definidos y se verifican en revisión.
3. Los casos de uso no dependen de HTTP ni de drivers de bases de datos.
4. Se ha documentado qué datos son propiedad de SQL y cuáles de MongoDB.
5. Docker Compose permite levantar la API y las bases de datos para desarrollo.
6. Las variables de entorno se validan y no se versionan secretos.
7. Existe una estrategia de migraciones y pruebas de integración.
8. Los controles de acceso consideran rol y recurso.
9. Las invariantes críticas de inventario y pedido tienen pruebas.
10. El contrato OpenAPI y los errores HTTP están documentados.
11. El build de producción genera una imagen Docker reproducible.
12. Los riesgos de consistencia entre pedido, inventario, pago y sistemas externos están documentados antes de implementar el flujo completo.

---

## 20. Resumen

NexusMarket utilizará TypeScript sobre Node.js, con una arquitectura hexagonal y DDD dentro de un monolito modular. PostgreSQL se recomienda para la persistencia transaccional y relacional; MongoDB queda destinado a casos documentales concretos, sin duplicar indiscriminadamente la fuente de verdad. Docker proporciona un entorno reproducible de desarrollo y empaquetado.

La estructura técnica debe proteger el dominio de los detalles de HTTP y persistencia, mantener la autorización por recurso y tratar explícitamente la concurrencia y los fallos de los flujos de compra. La tecnología hace posible la solución, pero no resuelve por sí misma los vacíos funcionales del SDD: los estados, las reglas comerciales y las excepciones críticas deben definirse antes de considerarse implementados.
