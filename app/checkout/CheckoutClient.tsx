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

type ShippingErrors = Partial<Record<keyof Shipping, string>>;

const STORAGE_KEY = "konaseema_shipping_v1";

/* =========================================================
   SUPPORTED COUNTRIES

   Add/remove countries here depending on where you deliver.
========================================================= */

const COUNTRIES = [
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "New Zealand",
  "United Arab Emirates",
  "Singapore",
  "Malaysia",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "Germany",
  "France",
  "Ireland",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Italy",
  "Spain",
  "Portugal",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "South Africa",
  "Japan",
  "South Korea",
];

/* =========================================================
   COMMON FAKE / PLACEHOLDER VALUES
========================================================= */

const FAKE_VALUES = new Set([
  "test",
  "testing",
  "abc",
  "abcd",
  "abcdef",
  "asdf",
  "asdfgh",
  "qwerty",
  "qwertyui",
  "sample",
  "dummy",
  "fake",
  "none",
  "null",
  "undefined",
  "na",
  "n/a",
  "address",
  "testaddress",
  "xxxx",
  "xxxxx",
  "1234",
  "12345",
  "123456",
]);

function cleanText(value: string) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactValue(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function looksFake(value: string) {
  const cleaned = cleanText(value);
  const compact = compactValue(value);

  if (!cleaned) return false;

  if (FAKE_VALUES.has(cleaned.toLowerCase())) {
    return true;
  }

  if (FAKE_VALUES.has(compact)) {
    return true;
  }

  /*
    Reject:
    aaaaa
    111111
    xxxxxx
  */
  if (/^(.)\1{3,}$/i.test(compact)) {
    return true;
  }

  return false;
}

/* =========================================================
   FULL NAME VALIDATION
========================================================= */

function validateName(value: string) {
  const name = cleanText(value);

  if (!name) {
    return "Full name is required";
  }

  if (name.length < 2) {
    return "Please enter a valid full name";
  }

  if (name.length > 70) {
    return "Name is too long";
  }

  if (looksFake(name)) {
    return "Please enter your real name";
  }

  /*
    Name must contain letters.
    Prevents:
    111111
    !!!!
  */
  if (!/[A-Za-z]/.test(name)) {
    return "Please enter a valid name";
  }

  /*
    Don't allow too many numbers inside names.
  */
  const numbers = name.match(/\d/g)?.length ?? 0;

  if (numbers > 1) {
    return "Please enter a valid name";
  }

  return "";
}

/* =========================================================
   EMAIL VALIDATION
========================================================= */

function validateEmail(value: string) {
  const email = cleanText(value).toLowerCase();

  if (!email) {
    return "Email is required";
  }

  if (email.length > 120) {
    return "Email is too long";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailPattern.test(email)) {
    return "Enter a valid email address";
  }

  return "";
}

/* =========================================================
   PHONE VALIDATION
========================================================= */

function validatePhone(
  value: string,
  country: string
) {
  if (!cleanText(value)) {
    return "Phone number is required";
  }

  let digits = value.replace(/\D/g, "");

  /*
    INDIA

    Allow:
    9618851406
    +91 9618851406
    0919618851406
  */
  if (country === "India") {
    if (
      digits.length === 12 &&
      digits.startsWith("91")
    ) {
      digits = digits.slice(2);
    }

    if (
      digits.length === 11 &&
      digits.startsWith("0")
    ) {
      digits = digits.slice(1);
    }

    if (!/^[6-9]\d{9}$/.test(digits)) {
      return "Enter a valid 10-digit Indian mobile number";
    }

    return "";
  }

  /*
    USA / CANADA
  */
  if (
    country === "United States" ||
    country === "Canada"
  ) {
    if (
      digits.length === 11 &&
      digits.startsWith("1")
    ) {
      digits = digits.slice(1);
    }

    if (digits.length !== 10) {
      return "Enter a valid 10-digit phone number";
    }

    return "";
  }

  /*
    GENERAL INTERNATIONAL NUMBER
  */
  if (digits.length < 8 || digits.length > 15) {
    return "Enter a valid phone number";
  }

  return "";
}

/* =========================================================
   ADDRESS VALIDATION
========================================================= */

function validateAddress(value: string) {
  const address = cleanText(value);

  if (!address) {
    return "Address is required";
  }

  if (address.length < 8) {
    return "Please enter a complete address";
  }

  if (address.length > 150) {
    return "Address is too long";
  }

  if (looksFake(address)) {
    return "Please enter a valid delivery address";
  }

  /*
    Address must contain letters.
    Prevents:
    111111111
  */
  if (!/[A-Za-z]/.test(address)) {
    return "Please enter a valid delivery address";
  }

  /*
    Require at least 2 meaningful words.

    Valid:
    Near Temple
    12 Main Street
    Flat 4B
    Door 10

    Invalid:
    abc
  */
  const words = address
    .split(/\s+/)
    .filter((word) => word.length >= 2);

  if (words.length < 2) {
    return "Please enter a more complete address";
  }

  return "";
}

/* =========================================================
   CITY VALIDATION
========================================================= */

function validateCity(value: string) {
  const city = cleanText(value);

  if (!city) {
    return "City is required";
  }

  if (city.length < 2) {
    return "Enter a valid city";
  }

  if (city.length > 60) {
    return "City name is too long";
  }

  if (looksFake(city)) {
    return "Enter a valid city";
  }

  if (!/[A-Za-z]/.test(city)) {
    return "Enter a valid city";
  }

  /*
    Cities generally should not contain several numbers.
  */
  if ((city.match(/\d/g)?.length ?? 0) > 0) {
    return "City should not contain numbers";
  }

  return "";
}

/* =========================================================
   STATE VALIDATION
========================================================= */

function validateState(value: string) {
  const state = cleanText(value);

  if (!state) {
    return "State / Province is required";
  }

  if (state.length < 2) {
    return "Enter a valid state / province";
  }

  if (state.length > 60) {
    return "State / province is too long";
  }

  if (looksFake(state)) {
    return "Enter a valid state / province";
  }

  if (!/[A-Za-z]/.test(state)) {
    return "Enter a valid state / province";
  }

  return "";
}

/* =========================================================
   POSTAL / ZIP VALIDATION
========================================================= */

function validatePostalCode(
  value: string,
  country: string
) {
  const zip = cleanText(value);

  if (!zip) {
    return "ZIP / Postal code is required";
  }

  if (looksFake(zip)) {
    return "Enter a valid ZIP / postal code";
  }

  /*
    INDIA
    Example: 533201
  */
  if (country === "India") {
    if (!/^[1-9][0-9]{5}$/.test(zip)) {
      return "Enter a valid 6-digit Indian PIN code";
    }

    return "";
  }

  /*
    USA
    90210
    90210-1234
  */
  if (country === "United States") {
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      return "Enter a valid US ZIP code";
    }

    return "";
  }

  /*
    CANADA
    K1A 0B1
  */
  if (country === "Canada") {
    if (
      !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(
        zip
      )
    ) {
      return "Enter a valid Canadian postal code";
    }

    return "";
  }

  /*
    UNITED KINGDOM
  */
  if (country === "United Kingdom") {
    const ukPattern =
      /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;

    if (!ukPattern.test(zip)) {
      return "Enter a valid UK postcode";
    }

    return "";
  }

  /*
    AUSTRALIA / NEW ZEALAND
  */
  if (
    country === "Australia" ||
    country === "New Zealand"
  ) {
    if (!/^\d{4}$/.test(zip)) {
      return "Enter a valid 4-digit postal code";
    }

    return "";
  }

  /*
    Generic international validation.

    Allows:
    numbers
    letters
    spaces
    hyphens
  */
  if (!/^[A-Za-z0-9 -]{3,12}$/.test(zip)) {
    return "Enter a valid ZIP / postal code";
  }

  return "";
}

/* =========================================================
   COMPLETE SHIPPING VALIDATION
========================================================= */

function validateShipping(
  shipping: Shipping
): ShippingErrors {
  const errors: ShippingErrors = {};

  const fullNameError =
    validateName(shipping.fullName);

  if (fullNameError) {
    errors.fullName = fullNameError;
  }

  const emailError =
    validateEmail(shipping.email);

  if (emailError) {
    errors.email = emailError;
  }

  if (!shipping.country) {
    errors.country = "Select a country";
  } else if (!COUNTRIES.includes(shipping.country)) {
    errors.country = "Select a valid country";
  }

  const phoneError =
    validatePhone(
      shipping.phone,
      shipping.country
    );

  if (phoneError) {
    errors.phone = phoneError;
  }

  const addressError =
    validateAddress(shipping.address1);

  if (addressError) {
    errors.address1 = addressError;
  }

  /*
    Address line 2 is optional,
    but if supplied, reject obvious fake values.
  */
  if (shipping.address2.trim()) {
    if (looksFake(shipping.address2)) {
      errors.address2 =
        "Please enter a valid address line";
    }

    if (shipping.address2.length > 120) {
      errors.address2 =
        "Address line is too long";
    }
  }

  const cityError =
    validateCity(shipping.city);

  if (cityError) {
    errors.city = cityError;
  }

  const stateError =
    validateState(shipping.state);

  if (stateError) {
    errors.state = stateError;
  }

  const zipError =
    validatePostalCode(
      shipping.zip,
      shipping.country
    );

  if (zipError) {
    errors.zip = zipError;
  }

  if (shipping.deliveryNotes.length > 500) {
    errors.deliveryNotes =
      "Delivery notes cannot exceed 500 characters";
  }

  return errors;
}

/* =========================================================
   ORDER TABLE
========================================================= */

function makeTable(
  headers: string[],
  rows: string[][]
) {
  const widths = headers.map((h, i) =>
    Math.max(
      h.length,
      ...rows.map((r) =>
        r[i] ? r[i].length : 0
      )
    )
  );

  const line = (cols: string[]) =>
    cols
      .map(
        (c, i) =>
          c +
          " ".repeat(
            widths[i] - c.length
          )
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

/* =========================================================
   CHECKOUT
========================================================= */

export default function CheckoutClient() {
  const cart = useCart();

  const [mounted, setMounted] =
    useState(false);

  const [shipping, setShipping] =
    useState<Shipping>({
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
    Partial<Record<keyof Shipping, boolean>>
  >({});

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  /* =======================================================
     MOUNT
  ======================================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     RESTORE SAVED SHIPPING
  ======================================================= */

  useEffect(() => {
    if (!mounted) return;

    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const saved = JSON.parse(raw);

        setShipping((previous) => ({
          ...previous,
          ...saved,
        }));
      }
    } catch (error) {
      console.warn(
        "Unable to restore shipping information:",
        error
      );
    }
  }, [mounted]);

  /* =======================================================
     SAVE SHIPPING
  ======================================================= */

  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(shipping)
      );
    } catch {}
  }, [shipping, mounted]);

  /* =======================================================
     VALIDATION
  ======================================================= */

  const errors = useMemo(
    () => validateShipping(shipping),
    [shipping]
  );

  const isValid =
    Object.keys(errors).length === 0;

  function markTouched(
    field: keyof Shipping
  ) {
    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));
  }

  function showError(
    field: keyof Shipping
  ) {
    if (!touched[field]) {
      return "";
    }

    return errors[field] || "";
  }

  /* =======================================================
     PRICE
  ======================================================= */

  const formatPrice = (value: number) =>
    `$${value.toFixed(2)}`;

  /* =======================================================
     WEIGHT
  ======================================================= */

  const getWeightInKg = (
    weight: string
  ) => {
    if (!weight) return 0;

    const normalized =
      weight.toLowerCase().trim();

    const value =
      parseFloat(normalized);

    if (isNaN(value)) {
      return 0;
    }

    if (
      normalized.includes("kg")
    ) {
      return value;
    }

    if (
      normalized.includes("g")
    ) {
      return value / 1000;
    }

    return 0;
  };

  /* =======================================================
     SHIPPING PRICE
  ======================================================= */

  const getShipping = (
    weightKg: number
  ) => {
    if (weightKg <= 5) return 29;
    if (weightKg <= 7.5) return 35;
    if (weightKg <= 10) return 40;
    if (weightKg <= 15) return 50;

    return 60;
  };

  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal = useMemo(() => {
    return (cart.items || []).reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.price) *
          Number(item.qty),
      0
    );
  }, [cart.items]);

  /* =======================================================
     TOTAL WEIGHT
  ======================================================= */

  const totalWeight = useMemo(() => {
    return (cart.items || []).reduce(
      (sum: number, item: any) => {
        return (
          sum +
          getWeightInKg(
            item.weight
          ) *
            Number(item.qty)
        );
      },
      0
    );
  }, [cart.items]);

  const shippingFee =
    (cart.items || []).length > 0
      ? getShipping(totalWeight)
      : 0;

  const total =
    subtotal + shippingFee;

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  const onPlaceOrder = () => {
    /*
      Force all important fields to show errors.
    */
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      country: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      zip: true,
      deliveryNotes: true,
    });

    setSaveError(null);

    const currentErrors =
      validateShipping(shipping);

    if (
      Object.keys(currentErrors)
        .length > 0
    ) {
      setSaveError(
        "Please correct the highlighted shipping details before continuing."
      );

      /*
        Scroll to the first invalid field.
      */
      setTimeout(() => {
        const firstInvalid =
          document.querySelector(
            '[aria-invalid="true"]'
          );

        firstInvalid?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);

      return;
    }

    if (
      (cart.items || []).length === 0
    ) {
      setSaveError(
        "Your cart is empty."
      );

      return;
    }

    if (
      !siteConfig.whatsappNumber
    ) {
      setSaveError(
        "WhatsApp contact is not configured yet."
      );

      return;
    }

    try {
      setSaving(true);

      /*
        Clean values before adding
        them into the WhatsApp order.
      */
      const cleanShipping = {
        ...shipping,

        fullName: cleanText(
          shipping.fullName
        ),

        email: cleanText(
          shipping.email
        ).toLowerCase(),

        phone: cleanText(
          shipping.phone
        ),

        address1: cleanText(
          shipping.address1
        ),

        address2: cleanText(
          shipping.address2
        ),

        city: cleanText(
          shipping.city
        ),

        state: cleanText(
          shipping.state
        ),

        zip: cleanText(
          shipping.zip
        ),

        deliveryNotes: cleanText(
          shipping.deliveryNotes
        ),
      };

      const orderId = `KS-${Date.now()
        .toString()
        .slice(-8)}`;

      const rows = (
        cart.items || []
      ).map((item: any) => [
        item.name,
        String(item.qty),
        `$${Number(
          item.price
        ).toFixed(2)}`,
        `$${(
          Number(item.qty) *
          Number(item.price)
        ).toFixed(2)}`,
      ]);

      const table = makeTable(
        [
          "Item",
          "Qty",
          "Price",
          "Total",
        ],
        rows
      );

      const message = `🛒 *Konaseema Specials Order*

Order ID: *${orderId}*

${table}

Subtotal: ${formatPrice(subtotal)}
Shipping: ${formatPrice(shippingFee)}
Total: *${formatPrice(total)}*

👤 *Customer Details*
Name: ${cleanShipping.fullName}
Phone: ${cleanShipping.phone}
Email: ${cleanShipping.email}

📍 *Delivery Address*
${cleanShipping.address1}${
        cleanShipping.address2
          ? `\n${cleanShipping.address2}`
          : ""
      }
${cleanShipping.city}, ${cleanShipping.state}
${cleanShipping.zip}
${cleanShipping.country}

Notes: ${
        cleanShipping.deliveryNotes ||
        "None"
      }`;

      const whatsappUrl =
        getWhatsAppUrl(message);

      /*
        Keep your existing behaviour.
      */
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

  /* =======================================================
     INPUT STYLES
  ======================================================= */

  const inputBase =
    "w-full px-4 py-3 rounded-2xl border bg-[#fffaf2] outline-none transition focus:ring-2 focus:ring-gold/30";

  const normalBorder =
    "border-gold";

  const errorBorder =
    "border-red-500 focus:ring-red-200";

  const getInputClass = (
    field: keyof Shipping
  ) =>
    `${inputBase} ${
      showError(field)
        ? errorBorder
        : normalBorder
    }`;

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
            {/* =========================================
                ORDER SUMMARY
            ========================================== */}

            <section className="card p-6">
              <h2 className="text-xl font-bold mb-4">
                Order Summary
              </h2>

              {(cart.items || []).length ===
              0 ? (
                <div className="opacity-70">
                  Your cart is empty.
                </div>
              ) : (
                (cart.items || []).map(
                  (item: any) => (
                    <div
                      key={item.id}
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
                          Number(
                            item.qty
                          ) *
                            Number(
                              item.price
                            )
                        )}
                      </span>
                    </div>
                  )
                )
              )}

              <div className="border-t mt-5 pt-4 space-y-2 font-semibold">
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

                {(cart.items || [])
                  .length > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Shipping (
                      {totalWeight.toFixed(
                        1
                      )}{" "}
                      kg)
                    </span>

                    <span>
                      {formatPrice(
                        shippingFee
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg border-t pt-2">
                  <span>Total</span>

                  <span>
                    {formatPrice(
                      total
                    )}
                  </span>
                </div>
              </div>

              <p className="mt-6 text-sm opacity-70">
                Your order details will
                be sent to Konaseema
                Specials on WhatsApp for
                confirmation.
              </p>
            </section>

            {/* =========================================
                SHIPPING DETAILS
            ========================================== */}

            <section className="card p-6">
              <h2 className="text-xl font-bold mb-1">
                Shipping Details
              </h2>

              <p className="text-sm opacity-65 mb-5">
                Please enter the address
                exactly as it should appear
                on the parcel.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* NAME */}

                <Field
                  label="Full Name *"
                  value={
                    shipping.fullName
                  }
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      fullName: value,
                    })
                  }
                  onBlur={() =>
                    markTouched(
                      "fullName"
                    )
                  }
                  className={getInputClass(
                    "fullName"
                  )}
                  error={showError(
                    "fullName"
                  )}
                  autoComplete="name"
                  maxLength={70}
                />

                {/* EMAIL */}

                <Field
                  label="Email *"
                  value={shipping.email}
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      email: value,
                    })
                  }
                  onBlur={() =>
                    markTouched("email")
                  }
                  className={getInputClass(
                    "email"
                  )}
                  error={showError(
                    "email"
                  )}
                  type="email"
                  autoComplete="email"
                  maxLength={120}
                />

                {/* PHONE */}

                <Field
                  label="Phone *"
                  value={shipping.phone}
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      phone: value,
                    })
                  }
                  onBlur={() =>
                    markTouched("phone")
                  }
                  className={getInputClass(
                    "phone"
                  )}
                  error={showError(
                    "phone"
                  )}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  placeholder={
                    shipping.country ===
                    "India"
                      ? "Example: 9618851406"
                      : "Include country code if required"
                  }
                />

                {/* COUNTRY */}

                <SelectField
                  label="Country *"
                  value={
                    shipping.country
                  }
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      country: value,
                      zip: "",
                    })
                  }
                  onBlur={() =>
                    markTouched(
                      "country"
                    )
                  }
                  className={getInputClass(
                    "country"
                  )}
                  error={showError(
                    "country"
                  )}
                  options={COUNTRIES}
                />

                {/* ADDRESS 1 */}

                <div className="md:col-span-2">
                  <Field
                    label="Address Line 1 *"
                    value={
                      shipping.address1
                    }
                    onChange={(value) =>
                      setShipping({
                        ...shipping,
                        address1: value,
                      })
                    }
                    onBlur={() =>
                      markTouched(
                        "address1"
                      )
                    }
                    className={getInputClass(
                      "address1"
                    )}
                    error={showError(
                      "address1"
                    )}
                    autoComplete="address-line1"
                    maxLength={150}
                    placeholder="House / Flat, Street, Area"
                  />
                </div>

                {/* ADDRESS 2 */}

                <div className="md:col-span-2">
                  <Field
                    label="Address Line 2"
                    value={
                      shipping.address2
                    }
                    onChange={(value) =>
                      setShipping({
                        ...shipping,
                        address2: value,
                      })
                    }
                    onBlur={() =>
                      markTouched(
                        "address2"
                      )
                    }
                    className={getInputClass(
                      "address2"
                    )}
                    error={showError(
                      "address2"
                    )}
                    autoComplete="address-line2"
                    maxLength={120}
                    placeholder="Apartment, landmark, building, etc. (optional)"
                  />
                </div>

                {/* CITY */}

                <Field
                  label="City *"
                  value={shipping.city}
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      city: value,
                    })
                  }
                  onBlur={() =>
                    markTouched("city")
                  }
                  className={getInputClass(
                    "city"
                  )}
                  error={showError(
                    "city"
                  )}
                  autoComplete="address-level2"
                  maxLength={60}
                />

                {/* STATE */}

                <Field
                  label="State / Province *"
                  value={shipping.state}
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      state: value,
                    })
                  }
                  onBlur={() =>
                    markTouched("state")
                  }
                  className={getInputClass(
                    "state"
                  )}
                  error={showError(
                    "state"
                  )}
                  autoComplete="address-level1"
                  maxLength={60}
                />

                {/* ZIP */}

                <Field
                  label={
                    shipping.country ===
                    "India"
                      ? "PIN Code *"
                      : "ZIP / Postal Code *"
                  }
                  value={shipping.zip}
                  onChange={(value) =>
                    setShipping({
                      ...shipping,
                      zip: value,
                    })
                  }
                  onBlur={() =>
                    markTouched("zip")
                  }
                  className={getInputClass(
                    "zip"
                  )}
                  error={showError(
                    "zip"
                  )}
                  inputMode={
                    shipping.country ===
                    "India"
                      ? "numeric"
                      : "text"
                  }
                  autoComplete="postal-code"
                  maxLength={12}
                  placeholder={
                    shipping.country ===
                    "India"
                      ? "6-digit PIN code"
                      : "Postal code"
                  }
                />

                {/* NOTES */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">
                    Delivery Notes
                  </label>

                  <textarea
                    className={`${inputBase} ${
                      showError(
                        "deliveryNotes"
                      )
                        ? errorBorder
                        : normalBorder
                    } min-h-[110px]`}
                    value={
                      shipping.deliveryNotes
                    }
                    onChange={(event) =>
                      setShipping({
                        ...shipping,
                        deliveryNotes:
                          event.target
                            .value,
                      })
                    }
                    onBlur={() =>
                      markTouched(
                        "deliveryNotes"
                      )
                    }
                    maxLength={500}
                    placeholder="Landmark, delivery instructions, etc."
                    aria-invalid={
                      Boolean(
                        showError(
                          "deliveryNotes"
                        )
                      )
                    }
                  />

                  {showError(
                    "deliveryNotes"
                  ) && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {showError(
                        "deliveryNotes"
                      )}
                    </p>
                  )}

                  <p className="mt-1 text-xs opacity-50 text-right">
                    {
                      shipping
                        .deliveryNotes
                        .length
                    }
                    /500
                  </p>
                </div>
              </div>

              {/* GENERAL ERROR */}

              {saveError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {saveError}
                </div>
              )}

              {/* BUTTON */}

              <button
                className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
                onClick={
                  onPlaceOrder
                }
                disabled={
                  saving ||
                  (cart.items || [])
                    .length === 0
                }
                type="button"
              >
                {saving
                  ? "Opening WhatsApp..."
                  : `Continue on WhatsApp (${formatPrice(
                      total
                    )})`}
              </button>

              <p className="mt-3 text-center text-xs opacity-60">
                Please double-check your
                delivery details before
                continuing.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  onBlur,
  className,
  error,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className: string;
  error?: string;
  type?: string;
  inputMode?:
    | "text"
    | "search"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "none";
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        {label}
      </label>

      <input
        className={className}
        value={value}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        onBlur={onBlur}
        aria-invalid={
          Boolean(error)
        }
      />

      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   COUNTRY SELECT
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  onBlur,
  className,
  error,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className: string;
  error?: string;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        {label}
      </label>

      <select
        className={className}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        onBlur={onBlur}
        aria-invalid={
          Boolean(error)
        }
      >
        <option value="">
          Select country
        </option>

        {options.map(
          (country) => (
            <option
              key={country}
              value={country}
            >
              {country}
            </option>
          )
        )}
      </select>

      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
