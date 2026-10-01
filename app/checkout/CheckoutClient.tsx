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
    Math.max(
      h.length,
      ...rows.map((r) => (r[i] ? r[i].length : 0))
    )
  );

  const line = (cols: string[]) =>
    cols
      .map(
        (c, i) =>
          c + " ".repeat(widths[i] - c.length)
      )
      .join("  ");

  const sep = widths
    .map((w) => "-".repeat(w))
    .join("  ");

  return [
    line(headers),
    sep,
    ...rows.map(line),
  ].join("\n");
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

  const [touched, setTouched] = useState<
    Record<string, boolean>
  >({});

  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState<
    string | null
  >(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        setShipping((p) => ({
          ...p,
          ...JSON.parse(raw),
        }));
      }
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(shipping)
      );
    } catch {}
  }, [shipping, mounted]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!shipping.fullName.trim()) {
      e.fullName = "Full name is required";
    }

    if (!shipping.email.trim()) {
      e.email = "Email is required";
    }

    if (!shipping.phone.trim()) {
      e.phone = "Phone is required";
    }

    if (!shipping.country.trim()) {
      e.country = "Country is required";
    }

    if (!shipping.address1.trim()) {
      e.address1 = "Address is required";
    }

    if (!shipping.city.trim()) {
      e.city = "City is required";
    }

    if (!shipping.state.trim()) {
      e.state = "State is required";
    }

    if (!shipping.zip.trim()) {
      e.zip = "ZIP is required";
    }

    return e;
  }, [shipping]);

  const isValid = useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  );

  const formatPrice = (v: number) =>
    `$${v.toFixed(2)}`;

  // -----------------------------
  // Product Subtotal
  // -----------------------------
  const subtotal = useMemo(() => {
    return (cart.items || []).reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.price) * Number(item.qty),
      0
    );
  }, [cart.items]);

  // -----------------------------
  // Shipping
  // -----------------------------
  // Shipping is NOT calculated automatically.
  // It will be discussed and confirmed
  // through WhatsApp.
  const shippingFee = 0;

  // This is only the product subtotal.
  // The final amount will be confirmed
  // after shipping charges are discussed.
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
      setSaveError(
        "Please fill all required fields."
      );
      return;
    }

    if ((cart.items || []).length === 0) {
      setSaveError("Your cart is empty.");
      return;
    }

    if (!siteConfig.whatsappNumber) {
      setSaveError(
        "WhatsApp contact is not configured yet."
      );
      return;
    }

    try {
      setSaving(true);

      // -----------------------------
      // Generate Order ID
      // -----------------------------
      const orderId = `KS-${Date.now()
        .toString()
        .slice(-8)}`;

      // -----------------------------
      // Generate Order Date
      // Example: 02 Oct 2026
      // -----------------------------
      const now = new Date();

      const day = String(
        now.getDate()
      ).padStart(2, "0");

      const month = now.toLocaleString(
        "en-US",
        {
          month: "short",
        }
      );

      const year = now.getFullYear();

      const orderDate = `${day} ${month} ${year}`;

      // -----------------------------
      // Product Table
      // -----------------------------
      const rows = (cart.items || []).map(
        (item: any) => [
          item.name,
          item.weight || "-",
          String(item.qty),
          formatPrice(Number(item.price)),
        ]
      );

      const table = makeTable(
        ["Item", "Weight", "Qty", "Price"],
        rows
      );

      // -----------------------------
      // WhatsApp Customer Order Message
      // -----------------------------
      const message = `🛍️ *KONASEEMA SPECIALS*
━━━━━━━━━━━━━━━━━━━━

📋 *NEW ORDER REQUEST*

🧾 Order ID: *${orderId}*
📅 Order Date: ${orderDate}

━━━━━━━━━━━━━━━━━━━━
📦 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━━━

\`\`\`
${table}
\`\`\`

━━━━━━━━━━━━━━━━━━━━
💰 *ORDER SUMMARY*
━━━━━━━━━━━━━━━━━━━━

Products Total: ${formatPrice(subtotal)}
Shipping Charges: *To be confirmed*

💵 *FINAL AMOUNT: To be confirmed*

━━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━

Name: ${shipping.fullName}
Phone: ${shipping.phone}
Email: ${shipping.email}

━━━━━━━━━━━━━━━━━━━━
📍 *DELIVERY ADDRESS*
━━━━━━━━━━━━━━━━━━━━

${shipping.address1}${
        shipping.address2
          ? `\n${shipping.address2}`
          : ""
      }
${shipping.city}, ${shipping.state}
${shipping.zip}
${shipping.country}

━━━━━━━━━━━━━━━━━━━━
📝 *DELIVERY NOTES*
━━━━━━━━━━━━━━━━━━━━

${
  shipping.deliveryNotes.trim() ||
  "No special instructions"
}

━━━━━━━━━━━━━━━━━━━━

📲 Please confirm the shipping charges
and let me know the final amount payable.

Thank you!`;

      const whatsappUrl =
        getWhatsAppUrl(message);

      cart.clear();

      window.location.href =
        whatsappUrl;
    } catch (error) {
      console.error(
        "CHECKOUT ERROR:",
        error
      );

      setSaveError(
        "Unable to prepare the WhatsApp order. Please try again."
      );

      setSaving(false);
    }
  };

  const inputBase =
    "w-full px-4 py-3 rounded-2xl border border-gold bg-[#fffaf2]";

  const inputErr =
    "border-red-400";

  const showErr = (
    key: keyof Shipping
  ) =>
    touched[key] &&
    errors[key];

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-5">

          <h1 className="text-4xl font-extrabold text-brown mb-8">
            Checkout
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* =========================
                ORDER SUMMARY
            ========================== */}
            <section className="card p-6">

              <h2 className="text-xl font-bold mb-4">
                Order Summary
              </h2>

              {(cart.items || []).length === 0 ? (
                <div className="opacity-70">
                  Your cart is empty.
                </div>
              ) : (
                (cart.items || []).map(
                  (item: any) => (
                    <div
                      key={`${item.id}__${item.weight}`}
                      className="flex justify-between mb-2 gap-4"
                    >
                      <span>
                        {item.name} ×{" "}
                        {item.qty}

                        {item.weight ? (
                          <span className="opacity-70">
                            {" "}
                            ({item.weight})
                          </span>
                        ) : null}
                      </span>

                      <span>
                        {formatPrice(
                          Number(item.qty) *
                          Number(item.price)
                        )}
                      </span>
                    </div>
                  )
                )
              )}

              <div className="border-t mt-5 pt-4 space-y-2 font-semibold">

                {/* PRODUCT SUBTOTAL */}
                <div className="flex justify-between">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(
                      subtotal
                    )}
                  </span>
                </div>

                {/* SHIPPING */}
                {(cart.items || []).length > 0 && (
                  <div className="flex justify-between items-start gap-4">
                    <span>
                      Shipping
                    </span>

                    <span className="text-right text-sm">
                      To be confirmed
                    </span>
                  </div>
                )}

                {/* AMOUNT */}
                <div className="flex justify-between text-lg border-t pt-2">
                  <span>
                    Product Total
                  </span>

                  <span>
                    {formatPrice(
                      total
                    )}
                  </span>
                </div>

              </div>

              <p className="mt-6 text-sm opacity-70">
                Shipping charges will be
                discussed and confirmed
                with you on WhatsApp before
                the final amount is confirmed.
              </p>

            </section>

            {/* =========================
                CUSTOMER DETAILS
            ========================== */}
            <section className="card p-6">

              <h2 className="text-xl font-bold mb-4">
                Shipping Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4">

                {/* FULL NAME */}
                <Field
                  label="Full Name *"
                  value={
                    shipping.fullName
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      fullName: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "fullName"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* EMAIL */}
                <Field
                  label="Email *"
                  value={
                    shipping.email
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      email: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "email"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* PHONE */}
                <Field
                  label="Phone *"
                  value={
                    shipping.phone
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      phone: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "phone"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* COUNTRY */}
                <Field
                  label="Country *"
                  value={
                    shipping.country
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      country: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "country"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* ADDRESS 1 */}
                <Field
                  label="Address Line 1 *"
                  value={
                    shipping.address1
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      address1: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "address1"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* ADDRESS 2 */}
                <Field
                  label="Address Line 2"
                  value={
                    shipping.address2
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      address2: v,
                    })
                  }
                  className={
                    inputBase
                  }
                />

                {/* CITY */}
                <Field
                  label="City *"
                  value={
                    shipping.city
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      city: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "city"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* STATE */}
                <Field
                  label="State *"
                  value={
                    shipping.state
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      state: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "state"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* ZIP */}
                <Field
                  label="ZIP / Postal *"
                  value={
                    shipping.zip
                  }
                  onChange={(v) =>
                    setShipping({
                      ...shipping,
                      zip: v,
                    })
                  }
                  className={`${inputBase} ${
                    showErr(
                      "zip"
                    )
                      ? inputErr
                      : ""
                  }`}
                />

                {/* DELIVERY NOTES */}
                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold mb-1">
                    Delivery Notes
                  </label>

                  <textarea
                    className={`${inputBase} min-h-[110px]`}
                    value={
                      shipping.deliveryNotes
                    }
                    onChange={(e) =>
                      setShipping({
                        ...shipping,
                        deliveryNotes:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              {/* ERROR */}
              {saveError && (
                <div className="mt-4 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              {/* WHATSAPP BUTTON */}
              <button
                className="btn-primary mt-6 w-full"
                onClick={
                  onPlaceOrder
                }
                disabled={
                  saving ||
                  (cart.items || [])
                    .length === 0
                }
              >
                {saving
                  ? "Opening WhatsApp..."
                  : "Send Order on WhatsApp"}
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

      <label className="block text-sm font-semibold mb-1">
        {label}
      </label>

      <input
        className={className}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      />

    </div>
  );
}
