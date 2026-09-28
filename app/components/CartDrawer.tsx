"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";

export default function CartDrawer() {
  const cart = useCart();
  const router = useRouter();

  const formatPrice = (v: number) =>
    `$${Number(v).toFixed(2)}`;

  return (
    <div
      className={`fixed inset-0 z-50 ${
        cart.isOpen ? "" : "pointer-events-none"
      }`}
      aria-hidden={!cart.isOpen}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          cart.isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={cart.close}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-[#fffaf2] border-l border-gold shadow-2xl transition-transform ${
          cart.isOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold">
          <div>
            <h3 className="text-2xl font-semibold">
              Your Cart
            </h3>

            <p className="opacity-75 text-sm">
              {cart.count} item(s)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {cart.items.length > 0 && (
              <button
                onClick={cart.clear}
                className="text-sm underline opacity-80 hover:opacity-100"
                type="button"
              >
                Clear Cart
              </button>
            )}

            <button
              onClick={cart.close}
              aria-label="Close cart"
              type="button"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="p-6 space-y-4 overflow-auto h-[calc(100%-250px)]">
          {cart.items.length === 0 ? (
            <div className="opacity-70 text-center mt-10">
              Your cart is empty.
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                /**
                 * IMPORTANT:
                 * Product ID alone is not unique anymore.
                 *
                 * Product + weight creates a unique cart row.
                 */
                key={`${item.id}__${item.weight}`}
                className="premium-card p-4"
              >
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    className="w-16 h-16 rounded-lg object-cover"
                    alt={item.name}
                  />

                  <div className="flex-1">
                    {/* Title + price */}
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="font-semibold">
                          {item.name}
                        </div>

                        {/* Selected weight */}
                        <div className="opacity-70 text-sm">
                          Weight: {item.weight}
                        </div>
                      </div>

                      <div className="font-bold">
                        {formatPrice(item.price ?? 0)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Decrease */}
                        <button
                          className="px-3 py-1 border border-gold rounded-full"
                          onClick={() =>
                            cart.dec(
                              item.id,
                              item.weight
                            )
                          }
                          type="button"
                          aria-label={`Decrease ${item.name} ${item.weight}`}
                        >
                          −
                        </button>

                        {/* Quantity */}
                        <span className="min-w-[24px] text-center font-semibold">
                          {item.qty}
                        </span>

                        {/* Increase */}
                        <button
                          className="px-3 py-1 border border-gold rounded-full"
                          onClick={() =>
                            cart.inc(
                              item.id,
                              item.weight
                            )
                          }
                          type="button"
                          aria-label={`Increase ${item.name} ${item.weight}`}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        className="text-sm underline opacity-80 hover:opacity-100"
                        onClick={() =>
                          cart.remove(
                            item.id,
                            item.weight
                          )
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Quantity + weight information */}
                    <div className="mt-2 text-sm opacity-70">
                      {item.weight} × {item.qty}
                    </div>

                    {/* Line total */}
                    <div className="mt-1 text-sm opacity-70">
                      Line total:{" "}
                      <span className="font-semibold">
                        {formatPrice(
                          (item.price ?? 0) *
                            item.qty
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gold">
          <div className="flex justify-between text-lg mb-4">
            <span className="opacity-80">
              Subtotal
            </span>

            <span className="font-bold">
              {formatPrice(cart.total)}
            </span>
          </div>

          <button
            className="btn-primary w-full"
            onClick={() => {
              if (cart.items.length === 0) return;

              cart.close();
              router.push("/checkout");
            }}
            type="button"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
