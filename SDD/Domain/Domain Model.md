# Domain Model 

## Modelo de Dominio - NexusMarket

## Introducción

El Modelo de Dominio representa las entidades centrales de negocio de la plataforma de comercio electrónico NexusMarket. Estas entidades encapsulan las reglas de negocio, datos, relaciones y conceptos del ciclo de vida descritos en la especificación del sistema.

El modelo sigue los principios del Diseño Orientado a Objetos (OOD) y el Diseño Guiado por el Dominio (DDD). 

El modelo distingue entre:

* **Usuarios** que representan identidades del sistema y roles de acceso.
* **Compradores y Vendedores** que representan las partes comerciales clave dentro de la plataforma.
* **Catálogo de Productos y Variantes** que encapsulan la oferta de bienes físicos o digitales.
* **Inventarios y Bodegas** que representan el almacenamiento físico distribuido y el control estricto de existencias.

* **Pedidos y Carrito de Compras** que gestionan las transacciones y el ciclo de vida de la compra.

* **Operaciones e Historial / Auditoría** que proporcionan la trazabilidad de los movimientos y transacciones ejecutados en el sistema.

---
# Jerarquía de Clases del Dominio

```text
Usuario (Abstracto)
├── Comprador
└── UsuarioAdministrativo
    ├── Vendedor
    ├── OperadorLogistico
    ├── Administrador
    └── Supervisor

Producto (Abstracto)
├── ProductoFisico
└── ProductoDigital

Bodega (Abstracto)
├── BodegaMarketplace
└── BodegaVendedor

Inventario

Variante

CarritoDeCompras

ItemCarrito

Pedido

ItemPedido

MovimientoInventario

RegistroAuditoria
```
# Relaciones del Dominio
````text
Usuario (Abstracto)
   │
   ├── Comprador ──────────> CarritoDeCompras ──> ItemCarrito ──> Variante
   │      │
   │      └── realiza ─────> Pedido ───────────> ItemPedido ───> Variante
   │                           		    │
   └── UsuarioAdministrativo            └── genera ────> MovimientoInventario
          ├── Vendedor                          	  	    │
          │     │                              			    ▼
          │     ├── gestiona ──> BodegaVendedor ──> Inventario <── Variante<──Producto
          │     └── posee ─────> Catálogo ────────> Producto
          ├── OperadorLogistico
          ├── Administrador
          │     └── administra ─> BodegaMarketplace
          └── Supervisor

MovimientoInventario
   └── registrado en ──────> RegistroAuditoria
````