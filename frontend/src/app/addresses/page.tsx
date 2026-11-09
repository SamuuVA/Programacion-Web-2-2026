import type { Metadata } from "next";
import { MapPinIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionToken, requireBuyer } from "@/features/auth/session";
import { fetchAddresses } from "@/features/addresses/api";
import { AddressCard } from "@/features/addresses/components/address-card";
import { AddressForm } from "@/features/addresses/components/address-form";

export const metadata: Metadata = {
  title: "Mis direcciones"
};

export default async function AddressesPage() {
  await requireBuyer("/addresses");
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const addresses = await fetchAddresses(token);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Entrega</p>
          <h1>Mis direcciones</h1>
          <p>
            Solo puede existir una dirección principal por comprador. Los pedidos
            guardan una copia de la dirección usada y no cambian si luego la
            editas.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container addresses-layout">
          <div className="addresses-list">
            {addresses.length === 0 ? (
              <EmptyState
                icon={<MapPinIcon width={24} height={24} />}
                title="Aún no tienes direcciones"
                description="Agrega una dirección para poder comprar productos físicos."
              />
            ) : (
              addresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))
            )}
          </div>

          <aside className="addresses-aside">
            <section className="checkout-block">
              <h2>Nueva dirección</h2>
              <p className="form-hint">
                La primera dirección se marca como principal automáticamente.
              </p>
              <AddressForm />
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
