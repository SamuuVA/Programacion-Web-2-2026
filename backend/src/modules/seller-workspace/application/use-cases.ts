import type { Clock, IdGenerator } from "../../../shared/application/ports.js";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError
} from "../../../shared/domain/errors.js";
import {
  assertBodegaActiva,
  assertProductoConInventario,
  assertProductoFisico,
  normalizarIngreso
} from "../domain/inventario-vendedor.js";
import {
  assertProductoEditable,
  assertTransicionPermitida,
  evaluarPublicacion,
  normalizarDatosProducto,
  normalizarImagen,
  textoObligatorio,
  type DatosProducto
} from "../domain/producto-vendedor.js";
import type {
  ProductChanges,
  SellerActor,
  SellerProfileView,
  SellerWorkspaceStore,
  WarehouseChanges
} from "./ports.js";

const NO_ENCONTRADO_PRODUCTO =
  "El producto no existe o no pertenece a tu catálogo.";
const NO_ENCONTRADO_BODEGA =
  "La bodega no existe o no pertenece a tu operación.";
const NO_ENCONTRADO_PEDIDO =
  "El pedido no existe o no contiene productos de tu catálogo.";

async function perfil(
  store: SellerWorkspaceStore,
  sellerId: string
): Promise<SellerProfileView> {
  const profile = await store.findProfile(sellerId);
  if (profile === null) {
    throw new AuthorizationError(
      "La cuenta no tiene un perfil de vendedor asociado."
    );
  }
  return profile;
}

function exigirVendedorActivo(profile: SellerProfileView): void {
  if (profile.estado !== "ACTIVO") {
    throw new AuthorizationError(
      "El perfil de vendedor no está activo para realizar esta operación."
    );
  }
}

export class GetSellerProfile {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor): Promise<SellerProfileView> {
    return perfil(this.store, actor.sellerId);
  }
}

export class UpdateSellerProfile {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock
  ) {}

  async execute(
    actor: SellerActor,
    input: { readonly nombreComercial: string }
  ): Promise<SellerProfileView> {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const nombreComercial = textoObligatorio(
      input.nombreComercial,
      "El nombre comercial"
    );
    const updated = await this.store.updateProfile(
      actor.sellerId,
      nombreComercial,
      this.clock.now().toString()
    );
    if (updated === null) {
      throw new ResourceNotFoundError("El perfil de vendedor no existe.");
    }
    return updated;
  }
}

export class ListSellerProducts {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor) {
    await perfil(this.store, actor.sellerId);
    return this.store.listProducts(actor.sellerId);
  }
}

export class GetSellerProduct {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor, productoId: string) {
    await perfil(this.store, actor.sellerId);
    const product = await this.store.findProduct(actor.sellerId, productoId);
    if (product === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    return product;
  }
}

export class CreateSellerProduct {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    actor: SellerActor,
    input: {
      readonly datos: DatosProducto;
      readonly imagenes?: readonly {
        readonly url: string;
        readonly alt?: string | undefined;
      }[];
    }
  ) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const datos = normalizarDatosProducto(input.datos);
    const imagenes = (input.imagenes ?? []).map((imagen, orden) => {
      const normalized = normalizarImagen(imagen);
      return {
        id: this.ids.productImageId(),
        url: normalized.url,
        alt: normalized.alt,
        orden
      };
    });

    return this.store.createProduct({
      id: this.ids.productoId(),
      vendedorId: actor.sellerId,
      datos,
      imagenes,
      creadoEn: this.clock.now().toString()
    });
  }
}

export class UpdateSellerProduct {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock
  ) {}

  async execute(
    actor: SellerActor,
    productoId: string,
    changes: ProductChanges
  ) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const current = await this.store.findProduct(actor.sellerId, productoId);
    if (current === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    assertProductoEditable(current.estado);

    const datos = normalizarDatosProducto({
      nombre: changes.nombre ?? current.nombre,
      descripcion: changes.descripcion ?? current.descripcion,
      categoria: changes.categoria ?? current.categoria,
      tipoEntrega: changes.tipoEntrega ?? current.tipoEntrega,
      sku: changes.sku ?? current.sku,
      precioCentavos: changes.precioCentavos ?? current.precioCentavos,
      moneda: changes.moneda ?? current.moneda
    });

    const updated = await this.store.updateProduct(
      actor.sellerId,
      productoId,
      datos,
      this.clock.now().toString()
    );
    if (updated === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    return updated;
  }
}

export class AddSellerProductImage {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    actor: SellerActor,
    productoId: string,
    input: { readonly url: string; readonly alt?: string | undefined }
  ) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const current = await this.store.findProduct(actor.sellerId, productoId);
    if (current === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    assertProductoEditable(current.estado);
    const imagen = normalizarImagen(input);
    const updated = await this.store.addProductImage({
      id: this.ids.productImageId(),
      vendedorId: actor.sellerId,
      productoId,
      url: imagen.url,
      alt: imagen.alt,
      creadoEn: this.clock.now().toString()
    });
    if (updated === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    return updated;
  }
}

export class RemoveSellerProductImage {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor, productoId: string, imageId: string) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const current = await this.store.findProduct(actor.sellerId, productoId);
    if (current === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    assertProductoEditable(current.estado);
    const updated = await this.store.removeProductImage(
      actor.sellerId,
      productoId,
      imageId
    );
    if (updated === null) {
      throw new ResourceNotFoundError(
        "La imagen no existe o no pertenece al producto."
      );
    }
    return updated;
  }
}

export class PublishSellerProduct {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock
  ) {}

  async execute(actor: SellerActor, productoId: string) {
    const profile = await perfil(this.store, actor.sellerId);
    const current = await this.store.findProduct(actor.sellerId, productoId);
    if (current === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    evaluarPublicacion(current, profile.estado === "ACTIVO");
    return this.transition(actor, current.estado, productoId, "PUBLICADO");
  }

  private async transition(
    actor: SellerActor,
    expected: Parameters<SellerWorkspaceStore["updateProductState"]>[2],
    productoId: string,
    next: Parameters<SellerWorkspaceStore["updateProductState"]>[3]
  ) {
    const updated = await this.store.updateProductState(
      actor.sellerId,
      productoId,
      expected,
      next,
      this.clock.now().toString()
    );
    if (updated === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    return updated;
  }
}

export class SuspendSellerProduct {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock
  ) {}

  async execute(actor: SellerActor, productoId: string) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const current = await this.store.findProduct(actor.sellerId, productoId);
    if (current === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    assertTransicionPermitida(current.estado, "SUSPENDIDO");
    return this.transition(actor, current.estado, productoId, "SUSPENDIDO");
  }

  private async transition(
    actor: SellerActor,
    expected: Parameters<SellerWorkspaceStore["updateProductState"]>[2],
    productoId: string,
    next: Parameters<SellerWorkspaceStore["updateProductState"]>[3]
  ) {
    const updated = await this.store.updateProductState(
      actor.sellerId,
      productoId,
      expected,
      next,
      this.clock.now().toString()
    );
    if (updated === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    return updated;
  }
}

export class DiscontinueSellerProduct {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock
  ) {}

  async execute(actor: SellerActor, productoId: string) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const current = await this.store.findProduct(actor.sellerId, productoId);
    if (current === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    assertTransicionPermitida(current.estado, "DESCONTINUADO");
    return this.transition(actor, current.estado, productoId, "DESCONTINUADO");
  }

  private async transition(
    actor: SellerActor,
    expected: Parameters<SellerWorkspaceStore["updateProductState"]>[2],
    productoId: string,
    next: Parameters<SellerWorkspaceStore["updateProductState"]>[3]
  ) {
    const updated = await this.store.updateProductState(
      actor.sellerId,
      productoId,
      expected,
      next,
      this.clock.now().toString()
    );
    if (updated === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    return updated;
  }
}

export class ListSellerWarehouses {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor) {
    await perfil(this.store, actor.sellerId);
    return this.store.listWarehouses(actor.sellerId);
  }
}

export class CreateSellerWarehouse {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    actor: SellerActor,
    input: { readonly nombre: string; readonly ubicacion: string }
  ) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    return this.store.createWarehouse({
      id: this.ids.warehouseId(),
      vendedorId: actor.sellerId,
      nombre: textoObligatorio(input.nombre, "El nombre de la bodega"),
      ubicacion: textoObligatorio(input.ubicacion, "La ubicación de la bodega"),
      creadaEn: this.clock.now().toString()
    });
  }
}

export class UpdateSellerWarehouse {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(
    actor: SellerActor,
    warehouseId: string,
    changes: WarehouseChanges
  ) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const normalized: WarehouseChanges = {
      nombre:
        changes.nombre === undefined
          ? undefined
          : textoObligatorio(changes.nombre, "El nombre de la bodega"),
      ubicacion:
        changes.ubicacion === undefined
          ? undefined
          : textoObligatorio(changes.ubicacion, "La ubicación de la bodega")
    };
    if (normalized.nombre === undefined && normalized.ubicacion === undefined) {
      throw new ValidationError(
        "Debes enviar al menos un campo para actualizar la bodega."
      );
    }
    const updated = await this.store.updateWarehouse(
      actor.sellerId,
      warehouseId,
      normalized
    );
    if (updated === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_BODEGA);
    }
    return updated;
  }
}

export class ListSellerInventory {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor) {
    await perfil(this.store, actor.sellerId);
    return this.store.listInventory(actor.sellerId);
  }
}

export class RegisterInventoryIngress {
  constructor(
    private readonly store: SellerWorkspaceStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    actor: SellerActor,
    input: {
      readonly productoId: string;
      readonly bodegaId: string;
      readonly cantidad: number;
      readonly idempotencyKey: string;
      readonly motivo?: string | null | undefined;
    }
  ) {
    exigirVendedorActivo(await perfil(this.store, actor.sellerId));
    const command = normalizarIngreso(input);

    const producto = await this.store.findProduct(
      actor.sellerId,
      command.productoId
    );
    if (producto === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PRODUCTO);
    }
    assertProductoFisico(producto.tipoEntrega);
    assertProductoConInventario(producto.estado);

    const bodegas = await this.store.listWarehouses(actor.sellerId);
    const bodega = bodegas.find(
      (candidate) => candidate.id === command.bodegaId
    );
    if (bodega === undefined) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_BODEGA);
    }
    assertBodegaActiva(bodega.estado);

    return this.store.registerIngress({
      vendedorId: actor.sellerId,
      actorId: actor.usuarioId,
      productoId: command.productoId,
      bodegaId: command.bodegaId,
      cantidad: command.cantidad,
      idempotencyKey: command.idempotencyKey,
      motivo: command.motivo,
      movimientoId: this.ids.movimientoInventarioId(),
      inventarioId: this.ids.inventarioId(),
      now: this.clock.now().toString()
    });
  }
}

export class ListSellerOrders {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor) {
    await perfil(this.store, actor.sellerId);
    return this.store.listOrders(actor.sellerId);
  }
}

export class GetSellerOrder {
  constructor(private readonly store: SellerWorkspaceStore) {}

  async execute(actor: SellerActor, orderId: string) {
    await perfil(this.store, actor.sellerId);
    const order = await this.store.findOrder(actor.sellerId, orderId);
    if (order === null) {
      throw new ResourceNotFoundError(NO_ENCONTRADO_PEDIDO);
    }
    return order;
  }
}
