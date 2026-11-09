/**
 * Etiquetas del espacio de supervisión.
 *
 * Se reutilizan los mapas ya existentes de vendedor, logística y pedidos para
 * no duplicar vocabulario ni introducir estados nuevos.
 */

export {
  ESTADO_PRODUCTO_LABEL,
  ESTADO_VENDEDOR_LABEL,
  estadoProductoTone,
  estadoVendedorTone
} from "@/features/seller/format";

export {
  ESTADO_ENVIO_LABEL,
  ESTADO_OPERADOR_LABEL,
  estadoEnvioTone,
  estadoOperadorTone
} from "@/features/logistics/format";

export {
  ESTADO_PAGO_LABEL,
  ESTADO_PEDIDO_LABEL,
  estadoPagoTone,
  estadoPedidoTone,
  formatFechaHora,
  formatMoney
} from "@/features/orders/format";

export { CATEGORIA_LABEL } from "@/features/catalog/format";
