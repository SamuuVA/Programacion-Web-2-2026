# Request DTOs — Contratos de entrada HTTP

> Adaptador de soporte **E12** de la capa de adaptadores de NexusMarket.

## 1. Propósito

Definir los **Request DTOs** (Data Transfer Objects de entrada): objetos que representan el cuerpo,
los parámetros de ruta y los parámetros de consulta de una solicitud HTTP, y que sirven de frontera
entre el modelo HTTP y los comandos que consumen los Input Ports.

## 2. ¿Por qué existen?

| Razón | Explicación |
|---|---|
| Separar modelo HTTP de modelo de dominio | `Input-Ports.md` (sección 4) distingue Request DTO, Mapper, Input Port y Domain Service. Exponer entidades de dominio en HTTP generaría acoplamiento innecesario. |
| Evitar que el cliente controle campos internos | El cliente no debe poder enviar `id`, `rol`, `estado` inicial ni marcas de auditoría. |
| Validar formato antes de entrar al núcleo | `Input-Ports.md` (sección 25.1) asigna la validación de formato al adaptador. |
| Aislar cambios de contrato | Un cambio de campos HTTP no obliga a modificar los comandos de la aplicación ni el dominio. |

Un Request DTO **no contiene lógica de negocio** y no representa una entidad de dominio.

## 3. Ubicación arquitectónica

```mermaid
flowchart LR
    HTTP["Solicitud HTTP"] --> DTO["Request DTO (E12)"]
    DTO --> VAL["Validación de formato"]
    VAL --> MP["Mapper de entrada (E14)"]
    MP --> CMD["Comando de aplicación"]
    CMD --> IP["Input Port"]
```

---

## 4. Catálogo de Request DTOs

Los DTOs se derivan de la "Entrada conceptual" documentada para cada caso de uso en
`Input-Ports.md` (secciones 9 a 20). **No se agregaron campos que no estén documentados.**

| # | Request DTO | Caso de uso | Campos documentados | Origen |
|---|---|---|---|---|
| 1 | `RegisterBuyerRequest` | `RegisterBuyerUseCase` | `nombreCompleto`, `correoElectronico`, `documentoIdentidad`, `direccionPrincipal`, `direccionesAdicionales` | `Input-Ports.md` §9.1 |
| 2 | `OnboardSellerRequest` | `OnboardSellerUseCase` | `nombreCompleto`, `correoElectronico`, `documentoIdentidad`, `razonSocial` | `Input-Ports.md` §9.2 |
| 3 | `UpdateUserAccessStatusRequest` | `UpdateUserAccessStatusUseCase` | `userId`, `newStatus` | `Input-Ports.md` §9.3 |
| 4 | `CreateWarehouseRequest` | `CreateWarehouseUseCase` | `nombre`, `ubicacion`, `tipoBodega` | `Input-Ports.md` §10.1 |
| 5 | `CreateProductRequest` | `CreateProductUseCase` | `nombre`, `descripcion`, `categoria`, `tipoProducto`, `variantes[]` | `Input-Ports.md` §11.1 |
| 6 | `UpdateProductStatusRequest` | `UpdateProductStatusUseCase` | `productId`, `newStatus` | `Input-Ports.md` §11.2 |
| 7 | `ReplenishStockRequest` | `ReplenishStockUseCase` | `warehouseId`, `variantId`, `quantity` | `Input-Ports.md` §12.1 |
| 8 | `DispatchInventoryRequest` | `DispatchInventoryUseCase` | `orderId` (el actor proviene del `ExecutionContext`) | `Input-Ports.md` §12.3 |
| 9 | `AddItemToCartRequest` | `AddItemToCartUseCase` | `cartId`, `variantId`, `quantity` | `Input-Ports.md` §13.1 |
| 10 | `RemoveItemFromCartRequest` | `RemoveItemFromCartUseCase` | `cartId`, `itemId` | `Input-Ports.md` §13.2 |
| 11 | `ConfirmCartRequest` | `ConfirmCartUseCase` | `cartId` | `Input-Ports.md` §13.3 |
| 12 | `ProcessPaymentRequest` | `ProcessPaymentUseCase` | `orderId`, `paymentData` | `Input-Ports.md` §15.1 |
| 13 | `CreateInvoiceRequest` | `CreateInvoiceUseCase` | `orderId`, `billingData` | `Input-Ports.md` §15.2 |
| 14 | `CreateShipmentRequest` | `CreateShipmentUseCase` | `orderId`, `address`, `deliveryMethod` | `Input-Ports.md` §16.1 |
| 15 | `RequestReturnRequest` | `RequestReturnUseCase` | `orderId`, `items`, `reason` | `Input-Ports.md` §17.1 |
| 16 | `ProcessRefundRequest` | `ProcessRefundUseCase` | `orderId`, `returnId` | `Input-Ports.md` §18.1 |
| 17 | `GenerateAdministrativeReportRequest` | `GenerateAdministrativeReportUseCase` | `reportType`, `dateRange`, `filters` | `Input-Ports.md` §19.1 |
| 18 | `QueryAuditLogRequest` | `QueryAuditLogUseCase` | `userId`, `eventType`, `dateRange`, `severity` | `Input-Ports.md` §20.1 |

### 4.1 Campos cuya forma interna no está documentada

Los siguientes campos aparecen documentados **solo por nombre**, sin estructura interna. El DTO
debe declararlos como pendientes de tipado definitivo, sin inventar su contenido:

| DTO | Campo | Observación |
|---|---|---|
| `ProcessPaymentRequest` | `paymentData` | Contenido no especificado (`Input-Ports.md` §15.1) |
| `CreateInvoiceRequest` | `billingData` | Contenido no especificado (`Input-Ports.md` §15.2) |
| `CreateProductRequest` | `variantes[]` | El modelo de dominio define `Variante` (`sku`, `nombreVariante`, `precio`), pero el comando no detalla la forma del arreglo |
| `GenerateAdministrativeReportRequest` | `reportType`, `filters`, `dateRange` | Tipos y valores permitidos no especificados |
| `QueryAuditLogRequest` | `eventType`, `dateRange` | Valores permitidos no especificados; la severidad sí está definida (`INFORMACION`, `ADVERTENCIA`, `ERROR`, `CRITICO`) |
| `RequestReturnRequest` | `items` | Estructura no especificada |

### 4.2 Request DTOs de casos antes no documentados

La `Input-Ports.md` ya documenta la entrada conceptual de estos casos de uso (resuelve O-03):

| Caso de uso | Request DTO | Campos | Origen |
|---|---|---|---|
| `ConfirmOrderUseCase` | `ConfirmOrderRequest` | `cartId`, `direccionEnvio` (opcional) | `Input-Ports.md` §14.1 |
| `GetOrderUseCase` | `GetOrderRequest` | `orderId` (ruta) | `Input-Ports.md` §14.2 |
| `UpdateOrderStatusUseCase` | `UpdateOrderStatusRequest` | `orderId`, `newStatus` | `Input-Ports.md` §14.3 |
| `ApproveReturnUseCase` | `ApproveReturnRequest` | `returnId`, `decision`, `itemsAprobados` (opcional) | `Input-Ports.md` §17.2 |
| `ReserveInventoryUseCase` | — | Sin DTO HTTP: caso de uso **interno** | `Input-Ports.md` §12.2 y §21 |

---

## 5. Campos prohibidos en un Request DTO

Estos campos **no** deben aceptarse desde HTTP, aunque existan en el modelo de dominio o en los
comandos internos:

| Campo | Motivo | Base |
|---|---|---|
| `contraseña` en respuestas y en cualquier DTO | Dato sensible | `DomainModel .md` §5.1 (almacenamiento seguro) |
| `rol` / `rolSistema` | El rol se resuelve en el `ExecutionContext`, no lo envía el cliente | `Input-Ports.md` §8 |
| `estado` inicial de usuario, producto o pedido | Los estados iniciales los determina el dominio (`ACTIVO`, `HABILITADO`, `PUBLICADO`, `PENDIENTE_PAGO`) | `Domain Object Value.md` §5, §6, §7, §8 |
| `estadoPago`, `estadoPedido` enviados por el cliente | Los cambios de estado dependen de reglas de negocio | `Services/OrderProcessingService.md` §5 |
| Identificadores autogenerados | El identificador lo asigna la persistencia | `Output-Ports.md` §5.1 |
| Marcas de auditoría (autor, fecha, severidad) | La auditoría la generan los servicios | `Services/AuditService.md` §4 |
| `cantidadDisponible`, `cantidadReservada` enviadas directamente | Solo se modifican mediante movimientos de inventario | `Services/InventoryService.md` §5 |

Regla del actor: ningún Request DTO incluye `operatorId` ni el `userId` del ejecutor. El actor
proviene del `ExecutionContext` (`Input-Ports.md`, §8). `DispatchInventoryCommand` ya no incluye
`operatorId` (`Input-Ports.md`, §12.3; resuelve O-06).

---

## 6. Validación de formato en el adaptador

Restricciones **documentadas** que el adaptador puede verificar sin invadir reglas de negocio:

| Campo | Validación de formato | Fuente |
|---|---|---|
| `nombreCompleto` | No vacío | `DomainModel .md` §5.1 |
| `correoElectronico` | Formato de correo válido (la unicidad es regla de negocio) | `DomainModel .md` §5.1; `Services/UserManagementService.md` §6 |
| `documentoIdentidad` | Presente y no vacío (la unicidad es regla de negocio) | `Input-Ports.md` §9.1 |
| `direccionPrincipal` | No vacía | `Services/UserManagementService.md` §4 |
| `razonSocial` | No vacía | `DomainModel .md` §5.4 |
| `nombreVariante`, `nombre` | No vacíos | `DomainModel .md` §6.4 |
| `precio` | Valor monetario válido | `DomainModel .md` §6.4 |
| `sku` | Presente; la unicidad es regla de negocio | `Services/CatalogService.md` §5 |
| `quantity` | Numérico y mayor que cero | `Services/InventoryService.md` §4 |
| `tipoBodega` | Valor permitido: `MARKETPLACE` o `VENDEDOR` | `Domain Object Value.md` §11 |
| `newStatus` (usuario) | Valor permitido: `ACTIVO`, `INACTIVO`, `BLOQUEADO` | `Domain Object Value.md` §5 |
| `newStatus` (producto) | Valor permitido: `PUBLICADO`, `SUSPENDIDO`, `DESCONTINUADO` | `Domain Object Value.md` §7 |
| `severity` | Valor permitido: `INFORMACION`, `ADVERTENCIA`, `ERROR`, `CRITICO` | `Domain Object Value.md` §13.1; `Services/AuditService.md` §3 |
| `deliveryMethod` | Valor permitido según `MetodoEntrega` | `Domain Object Value.md` §13.2 |
| Identificadores de ruta | Presentes y con formato coherente | Convención del adaptador |

### Frontera explícita

```text
Adaptador:  "¿el campo está bien formado y usa un valor del catálogo?"
Servicio:   "¿el correo ya existe?, ¿el producto pertenece al vendedor?, ¿hay stock suficiente?"
```

Comprobar que un valor pertenece a un catálogo cerrado es validación de formato porque el catálogo
está definido por el dominio (`Domain Object Value.md`). Decidir **si la transición de estado es
permitida** es regla de negocio y pertenece al servicio.

---

## 7. Errores de validación

Cuando la validación de formato falla, el adaptador responde sin invocar el Input Port:

```text
1. DTO inválido
2. Adaptador no invoca el caso de uso
3. Respuesta 400 con la lista de campos inválidos
4. El núcleo no se ejecuta y no se genera auditoría
```

Estructura propuesta para el error de validación (pendiente de confirmación en el catálogo de
errores):

```text
{
  "error": "<categoria>",
  "detalles": [
    { "campo": "<nombre del campo>", "problema": "<motivo>" }
  ]
}
```

---

## 8. Reglas arquitectónicas

1. Un Request DTO por caso de uso expuesto; los casos de uso internos no necesitan DTO HTTP.
2. El DTO no contiene reglas de negocio ni cálculos de dominio.
3. El DTO no expone ni importa entidades del dominio.
4. El mapeo DTO → comando se realiza en el mapper de entrada (E14), no en el DTO.
5. Los campos con estructura no documentada se declaran explícitamente como pendientes.
6. Los valores de catálogo se validan contra los códigos definidos en `Domain Object Value.md`.
7. El actor nunca proviene del DTO.

---

## 9. Consideraciones de seguridad

- No aceptar campos que permitan escalar privilegios (`rol`, `estado`, identificadores ajenos).
- No reflejar en la respuesta de error listas internas ni detalles de infraestructura.
- No registrar en los logs datos sensibles provenientes del DTO (`contraseña`, `paymentData`,
  `billingData`). `DomainModel .md` §5.1 exige almacenamiento seguro de la credencial; el adaptador
  no debe filtrarla a trazas ni a respuestas.

---

## 10. Pendientes de definición

- Estructura interna de `paymentData`, `billingData`, `items`, `filters`, `dateRange` y `reportType`.
- Formato definitivo de fechas y de paginación.

Resueltos en `Input-Ports.md` / `Output-Ports.md` (ver `../observaciones-arquitectonicas.md`): entrada
conceptual de `ConfirmOrderUseCase`, `GetOrderUseCase`, `UpdateOrderStatusUseCase` y
`ApproveReturnUseCase` (O-03); formato de identificadores —`string` opaco, `DomainModel .md` §2.5— (O-05);
catálogo de errores de aplicación con mapeo HTTP (§26, O-18) y uso de `operatorId` (O-06).

