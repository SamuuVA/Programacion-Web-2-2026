# AuditService

## 1. Descripción
Servicio de dominio **stateless** transversal encargado de registrar y conservar la trazabilidad de las operaciones relevantes de NexusMarket.

El registro de auditoría es **inmutable y append-only**.

```text
Crear evento  -> permitido
Agregar evento -> permitido
Modificar evento existente -> no permitido
Eliminar evento -> no permitido
```

## 2. Responsabilidades
- Registrar eventos.
- Identificar actor, operación, fecha y entidad afectada.
- Clasificar severidad.
- Preservar historial.
- Servir como componente transversal de auditoría.

## 3. Entidades y objetos
- `RegistroAuditoria`
- Usuario/actor responsable.
- Entidad afectada.
- `GravedadAuditoria`

### Severidades
- `INFORMACION`
- `ADVERTENCIA`
- `ERROR`
- `CRITICO`

## 4. Operación

### `recordEvent`

```text
recordEvent(eventData): AuditLog
```

**Precondiciones**
- Información suficiente para identificar el evento.
- Actor identificable cuando corresponda.
- Severidad válida.
- Entidad afectada identificable cuando corresponda.

**Flujo**
1. Recibir evento desde un servicio de dominio.
2. Validar datos.
3. Crear `RegistroAuditoria`.
4. Agregarlo al historial.
5. Mantenerlo inmutable.

**Postcondiciones**
- Nuevo registro disponible.
- Registro no modificable por operaciones normales del dominio.
- Evento trazable.

## 5. Eventos relevantes

### Usuarios
- Registro de comprador.
- Incorporación de vendedor.
- Cambio de estado de usuario.

### Catálogo
- Publicación de producto.
- Cambio de estado.

### Inventario
- `INGRESO`
- `RESERVA`
- `SALIDA_VENTA`
- `AJUSTE`
- `DEVOLUCION`

### Pedidos
- Creación.
- Resultado del pago.
- Cambios de estado.
- Despacho.
- Entrega.
- Cancelación.

## 6. Información mínima

| Pregunta | Dato |
|---|---|
| ¿Qué ocurrió? | Operación |
| ¿Cuándo? | Fecha/hora |
| ¿Quién? | Actor |
| ¿Sobre qué? | Entidad afectada |
| ¿Resultado? | Resultado |
| ¿Qué severidad? | `GravedadAuditoria` |

Estos datos se materializan en los atributos de `RegistroAuditoria` (`DomainModel .md`, §11):
`tipoEvento` (qué), `marcaTiempo` (cuándo), `realizadoPorUsuario`/`rolUsuario` (quién),
`entidadTipo`/`entidadId` (sobre qué), `resultado` (resultado) y `gravedad` (severidad), lo que
resuelve la observación O-10.

## 7. Reglas de negocio
- Los registros son inmutables.
- El historial es append-only.
- Los eventos deben permitir trazabilidad.
- La severidad debe ser válida.
- Los movimientos de inventario deben quedar auditados.
- Los cambios importantes de pedidos y productos deben quedar auditados.

## 8. Ejemplo: reserva

```text
OrderProcessingService
        |
        v
InventoryService
        |
        +--> actualiza inventario
        +--> crea RESERVA
        |
        v
AuditService.recordEvent()
        |
        v
RegistroAuditoria
```

## 9. Errores
- Evento incompleto.
- Severidad inválida.
- Actor no identificable cuando sea obligatorio.
- Intento de modificar evento existente.
- Intento de eliminar evento.

## 10. Invariantes
- Un evento registrado permanece en el historial.
- Su contenido no se modifica.
- No se sobrescriben eventos anteriores.
- El historial conserva la trazabilidad.

## 11. Límites
`AuditService` no autoriza usuarios ni ejecuta operaciones de catálogo, inventario, pedidos, pagos o logística. Solo registra y preserva evidencia de las operaciones del dominio.
