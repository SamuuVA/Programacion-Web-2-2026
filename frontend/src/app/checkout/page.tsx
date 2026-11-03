import type { Metadata } from "next";
import { getSessionToken, requireBuyer } from "@/features/auth/session";
import { fetchAddresses } from "@/features/addresses/api";
import { fetchCart } from "@/features/cart/api";
import { CheckoutForm } from "@/features/orders/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout"
};

export default async function CheckoutPage() {
  await requireBuyer("/checkout");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const [cart, addresses] = await Promise.all([
    fetchCart(token),
    fetchAddresses(token)
  ]);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Pago simulado</p>
          <h1>Confirmar compra</h1>
          <p>
            Revisa la dirección y el total. La operación es idempotente: un
            reintento con la misma clave no duplica pedidos ni reservas.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container checkout-layout">
          <CheckoutForm cart={cart} addresses={addresses} />
        </div>
      </section>
    </>
  );
}
