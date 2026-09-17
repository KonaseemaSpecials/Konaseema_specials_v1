"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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

export type CartItem = Product & { qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: Product, qty?: number) => void;
  dec: (id: string) => void;
  inc: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const STORAGE_KEY = "konaseema_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * (i.price ?? 0), 0),
    [items]
  );

  const add = (p: Product, qty: number = 1) => {
    setItems((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        return prev.map((x) =>
          x.id === p.id ? { ...x, qty: x.qty + qty } : x
        );
      }
      return [...prev, { ...p, qty }];
    });

    // Keep the customer on the current page. They can open the cart manually.
    setToast(`${p.name} added to cart`);
  };

  const inc = (id: string) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));

  const dec = (id: string) =>
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0)
    );

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const clear = () => setItems([]);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((v) => !v);

  return (
    <CartContext.Provider
      value={{ items, count, total, add, dec, inc, remove, clear, isOpen, open, close, toggle }}
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
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
