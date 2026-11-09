import type { Metadata } from "next";
import Link from "next/link";
import { CartIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { requireBuyer, getSessionToken } from "@/features/auth/session";
import { fetchCart } from "@/features/cart/api";
import { CartLine } from "@/features/cart/components/cart-line";
import { formatMoney } from "@/features/orders/format";

export const metadata: Metadata = {
  title: "Carrito"
};

export default async function CartPage() {
  await requireBuyer("/cart");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const cart = await fetchCart(token);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Tu compra</p>
          <h1>Carrito</h1>
          <p>
            Los precios y la disponibilidad se vuelven a validar al confirmar la
            compra. Agregar al carrito no reserva inventario.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          {cart.items.length === 0 ? (
            <EmptyState
              icon={<CartIcon width={24} height={24} />}
              title="Tu carrito está vacío"
              description="Explora el catálogo y agrega productos de vendedores activos."
              action={{ href: "/products", label: "Ver catálogo" }}
            />
          ) : (
            <div className="cart-layout">
              <div className="cart-lines">
                {cart.items.map((item) => (
                  <CartLine key={item.productoId} item={item} />
                ))}
              </div>

              <aside className="cart-summary">
                <h2>Resumen</h2>
                <div className="summary-row">
                  <span>Productos</span>
                  <span>{cart.items.length}</span>
                </div>
                <div className="summary-row summary-total">
                  <span>Total</span>
                  <strong>
                    {cart.moneda
                      ? formatMoney(cart.totalCentavos, cart.moneda)
                      : formatMoney(0, "COP")}
                  </strong>
                </div>

                {cart.requiereConfirmacionPrecio ? (
                  <p className="cart-line-warning" role="status">
                    Algunos precios cambiaron desde que agregaste los productos. El
                    checkout te pedirá confirmarlos.
                  </p>
                ) : null}

                <Link className="btn btn-primary" href="/checkout">
                  Continuar al checkout
                </Link>
                <Link className="text-link" href="/products">
                  Seguir comprando
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
