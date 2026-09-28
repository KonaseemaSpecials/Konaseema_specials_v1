"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Product = {
  id: string;
  name: string;
  price?: number;
  priceKey?: string;
  weight: string;
  category: string;
  image: string;
  highlights?: string[];
};

export type CartItem = Product & {
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: Product, qty?: number) => void;
  dec: (id: string, weight: string) => void;
  inc: (id: string, weight: string) => void;
  remove: (id: string, weight: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

const STORAGE_KEY = "konaseema_cart_v1";

/**
 * Creates a unique key for a product + selected weight.
 *
 * Example:
 * product id: "kova"
 * weight: "1kg"
 *
 * => "kova__1kg"
 *
 * This allows the same product to exist in the cart
 * with different weights.
 */
const getCartItemKey = (item: {
  id: string;
  weight: string;
}) => `${item.id}__${item.weight}`;

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /**
   * Load cart from localStorage.
   */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const savedItems = JSON.parse(raw);

        if (Array.isArray(savedItems)) {
          setItems(savedItems);
        }
      }
    } catch {
      // Ignore invalid localStorage data
    }
  }, []);

  /**
   * Save cart to localStorage whenever items change.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore localStorage errors
    }
  }, [items]);

  /**
   * Hide toast after 2.4 seconds.
   */
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /**
   * Total number of products/quantities in the cart.
   *
   * Example:
   * Kova 1kg x 2
   * Kova 500g x 1
   *
   * count = 3
   */
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  /**
   * Total cart price.
   */
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.qty * (item.price ?? 0),
        0
      ),
    [items]
  );

  /**
   * Add product to cart.
   *
   * IMPORTANT:
   * A product is considered the same cart item only when
   * BOTH product ID and weight are the same.
   *
   * Example:
   *
   * Kova + 1kg
   * Kova + 500g
   *
   * are two different cart items.
   */
  const add = (p: Product, qty: number = 1) => {
    setItems((prev) => {
      const newItemKey = getCartItemKey(p);

      const found = prev.find(
        (item) => getCartItemKey(item) === newItemKey
      );

      if (found) {
        return prev.map((item) =>
          getCartItemKey(item) === newItemKey
            ? {
                ...item,
                qty: item.qty + qty,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...p,
          qty,
        },
      ];
    });

    /**
     * Show selected product, weight and quantity
     * to the customer.
     */
    setToast(
      `${p.name} (${p.weight}) × ${qty} added to cart`
    );
  };

  /**
   * Increase quantity for a specific product + weight.
   */
  const inc = (id: string, weight: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.weight === weight
          ? {
              ...item,
              qty: item.qty + 1,
            }
          : item
      )
    );
  };

  /**
   * Decrease quantity for a specific product + weight.
   */
  const dec = (id: string, weight: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id && item.weight === weight
            ? {
                ...item,
                qty: item.qty - 1,
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  /**
   * Remove a specific product + weight from cart.
   */
  const remove = (id: string, weight: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === id && item.weight === weight)
      )
    );
  };

  /**
   * Clear entire cart.
   */
  const clear = () => {
    setItems([]);
  };

  const open = () => setIsOpen(true);

  const close = () => setIsOpen(false);

  const toggle = () => {
    setIsOpen((value) => !value);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        add,
        dec,
        inc,
        remove,
        clear,
        isOpen,
        open,
        close,
        toggle,
      }}
    >
      {children}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-24 z-[10000] -translate-x-1/2 rounded-2xl border border-[#d9c7aa] bg-[#fffaf2] px-5 py-3 text-sm font-semibold text-[#2c1f14] shadow-xl backdrop-blur-sm"
        >
          ✓ {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return ctx;
}
