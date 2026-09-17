"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../components/CartContext";
import { getWhatsAppUrl, siteConfig } from "../lib/siteConfig";

type Shipping = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  deliveryNotes: string;
};

const STORAGE_KEY = "konaseema_shipping_v1";

function makeTable(headers: string[], rows: string[][]) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ? r[i].length : 0)))
  );

  const line = (cols: string[]) =>
    cols.map((c, i) => c + " ".repeat(widths[i] - c.length)).join("  ");

  const sep = widths.map((w) => "-".repeat(w)).join("  ");
  return [line(headers), sep, ...rows.map(line)].join("\n");
}

export default function CheckoutClient() {
  const cart = useCart();
  const [mounted, setMounted] = useState(false);

  const [shipping, setShipping] = useState<Shipping>({
    fullName: "",
    email: "",
    phone: "",
    country: "India",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    deliveryNotes: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setShipping((p) => ({ ...p, ...JSON.parse(raw) }));
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
    } catch {}
  }, [shipping, mounted]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!shipping.fullName.trim()) e.fullName = "Full name is required";
    if (!shipping.email.trim()) e.email = "Email is required";
    if (!shipping.phone.trim()) e.phone = "Phone is required";
    if (!shipping.country.trim()) e.country = "Country is required";
    if (!shipping.address1.trim()) e.address1 = "Address is required";
    if (!shipping.city.trim()) e.city = "City is required";
    if (!shipping.state.trim()) e.state = "State is required";
    if (!shipping.zip.trim()) e.zip = "ZIP is required";
    return e;
  }, [shipping]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const formatPrice = (v: number) => `$${v.toFixed(2)}`;

  const getWeightInKg = (w: string) => {
    if (!w) return 0;
    const value = parseFloat(w);
    if (isNaN(value)) return 0;
    if (w.toLowerCase().includes("kg")) return value;
    if (w.toLowerCase().includes("g")) return value / 1000;
    return 0;
  };

  const getShipping = (weightKg: number) => {
    if (weightKg <= 5) return 29;
    if (weightKg <= 7.5) return 35;
    if (weightKg <= 10) return 40;
    if (weightKg <= 15) return 50;
    return 60;
  };

  const subtotal = useMemo(() => {
    return (cart.items || []).reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.qty),
      0
    );
  }, [cart.items]);

  const totalWeight = useMemo(() => {
    return (cart.items || []).reduce((sum: number, item: any) => {
      return sum + getWeightInKg(item.weight) * Number(item.qty);
    }, 0);
  }, [cart.items]);

  const shippingFee =
    (cart.items || []).length > 0 ? getShipping(totalWeight) : 0;

  const total = subtotal + shippingFee;

  const onPlaceOrder = () => {
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      country: true,
      address1: true,
      city: true,
      state: true,
      zip: true,
    });

    setSaveError(null);

    if (!isValid) {
      setSaveError("Please fill all required fields.");
      return;
    }

    if ((cart.items || []).length === 0) {
      setSaveError("Your cart is empty.");
      return;
    }

    if (!siteConfig.whatsappNumber) {
      setSaveError("WhatsApp contact is not configured yet.");
      return;
    }

    try {
      setSaving(true);

      const orderId = `KS-${Date.now().toString().slice(-8)}`;
      const rows = (cart.items || []).map((item: any) => [
        item.name,
        String(item.qty),
        `$${Number(item.price).toFixed(2)}`,
        `$${(Number(item.qty) * Number(item.price)).toFixed(2)}`,
      ]);

      const table = makeTable(["Item", "Qty", "Price", "Total"], rows);

      const message = `🛒 *Konaseema Specials Order*\nOrder ID: *${orderId}*\n\n${table}\n\nSubtotal: ${formatPrice(
        subtotal
      )}\nShipping: ${formatPrice(shippingFee)}\nTotal: *${formatPrice(
        total
      )}*\n\n👤 *Customer Details*\nName: ${shipping.fullName}\nPhone: ${
        shipping.phone
      }\nEmail: ${shipping.email}\n\n📍 *Delivery Address*\n${
        shipping.address1
      }${shipping.address2 ? `\n${shipping.address2}` : ""}\n${shipping.city}, ${
        shipping.state
      }\n${shipping.zip}\n${shipping.country}\n\nNotes: ${
        shipping.deliveryNotes || "None"
      }`;

      const whatsappUrl = getWhatsAppUrl(message);
      cart.clear();
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      setSaveError("Unable to prepare the WhatsApp order. Please try again.");
      setSaving(false);
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-2xl border border-gold bg-[#fffaf2]";
  const inputErr = "border-red-400";
  const showErr = (key: keyof Shipping) => touched[key] && errors[key];

  if (!mounted) return null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-5">
          <h1 className="text-4xl font-extrabold text-brown mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              {(cart.items || []).length === 0 ? (
                <div className="opacity-70">Your cart is empty.</div>
              ) : (
                (cart.items || []).map((item: any) => (
                  <div key={item.id} className="flex justify-between mb-2 gap-4">
                    <span>
                      {item.name} × {item.qty}
                      {item.weight ? (
                        <span className="opacity-70"> ({item.weight})</span>
                      ) : null}
                    </span>
                    <span>{formatPrice(Number(item.qty) * Number(item.price))}</span>
                  </div>
                ))
              )}

              <div className="border-t mt-5 pt-4 space-y-2 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {(cart.items || []).length > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping ({totalWeight.toFixed(1)} kg)</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <p className="mt-6 text-sm opacity-70">
                Your order details will be sent to Konaseema Specials on WhatsApp for confirmation.
              </p>
            </section>

            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4">Shipping Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Full Name *"
                  value={shipping.fullName}
                  onChange={(v) => setShipping({ ...shipping, fullName: v })}
                  className={`${inputBase} ${showErr("fullName") ? inputErr : ""}`}
                />
                <Field
                  label="Email *"
                  value={shipping.email}
                  onChange={(v) => setShipping({ ...shipping, email: v })}
                  className={`${inputBase} ${showErr("email") ? inputErr : ""}`}
                />
                <Field
                  label="Phone *"
                  value={shipping.phone}
                  onChange={(v) => setShipping({ ...shipping, phone: v })}
                  className={`${inputBase} ${showErr("phone") ? inputErr : ""}`}
                />
                <Field
                  label="Country *"
                  value={shipping.country}
                  onChange={(v) => setShipping({ ...shipping, country: v })}
                  className={`${inputBase} ${showErr("country") ? inputErr : ""}`}
                />
                <Field
                  label="Address Line 1 *"
                  value={shipping.address1}
                  onChange={(v) => setShipping({ ...shipping, address1: v })}
                  className={`${inputBase} ${showErr("address1") ? inputErr : ""}`}
                />
                <Field
                  label="Address Line 2"
                  value={shipping.address2}
                  onChange={(v) => setShipping({ ...shipping, address2: v })}
                  className={inputBase}
                />
                <Field
                  label="City *"
                  value={shipping.city}
                  onChange={(v) => setShipping({ ...shipping, city: v })}
                  className={`${inputBase} ${showErr("city") ? inputErr : ""}`}
                />
                <Field
                  label="State *"
                  value={shipping.state}
                  onChange={(v) => setShipping({ ...shipping, state: v })}
                  className={`${inputBase} ${showErr("state") ? inputErr : ""}`}
                />
                <Field
                  label="ZIP / Postal *"
                  value={shipping.zip}
                  onChange={(v) => setShipping({ ...shipping, zip: v })}
                  className={`${inputBase} ${showErr("zip") ? inputErr : ""}`}
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Delivery Notes</label>
                  <textarea
                    className={`${inputBase} min-h-[110px]`}
                    value={shipping.deliveryNotes}
                    onChange={(e) =>
                      setShipping({ ...shipping, deliveryNotes: e.target.value })
                    }
                  />
                </div>
              </div>

              {saveError && (
                <div className="mt-4 text-sm text-red-600">{saveError}</div>
              )}

              <button
                className="btn-primary mt-6 w-full"
                onClick={onPlaceOrder}
                disabled={saving || (cart.items || []).length === 0}
              >
                {saving ? "Opening WhatsApp..." : `Continue on WhatsApp (${formatPrice(total)})`}
              </button>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
