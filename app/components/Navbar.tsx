"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";
import { getWhatsAppUrl, siteConfig } from "../lib/siteConfig";

export default function Navbar() {
  const cart = useCart();
  const router = useRouter();

  const goToSection = (id: string) => {
    router.push(`/#${id}`);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-cream/90 border-b border-gold">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="brand-logo text-4xl text-brown font-black tracking-wider"
          aria-label="Go to home"
        >
          Konaseema Specials
        </Link>

        <div className="hidden md:flex gap-8 font-semibold items-center">
          <button
            className="hover:text-gold transition-colors"
            onClick={() => goToSection("home")}
            type="button"
          >
            Home
          </button>

          <button
            className="hover:text-gold transition-colors"
            onClick={() => goToSection("categories")}
            type="button"
          >
            Categories
          </button>

          <button
            className="hover:text-gold transition-colors"
            onClick={() => goToSection("products")}
            type="button"
          >
            Products
          </button>

          <button
            className="hover:text-gold transition-colors"
            onClick={() => goToSection("about")}
            type="button"
          >
            About
          </button>

          <button
            className="hover:text-gold transition-colors"
            onClick={() => goToSection("contact")}
            type="button"
          >
            Contact
          </button>
        </div>

        <div className="flex items-center gap-2">
          {siteConfig.whatsappNumber && (
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat on WhatsApp"
              title="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-green-700 active:scale-95"
            >
              <MessageCircle size={21} strokeWidth={2.2} />
            </a>
          )}

          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gold/10 transition-colors"
            onClick={cart.open}
            aria-label="Open cart"
            type="button"
          >
            <ShoppingCart size={24} />

            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-gold text-brown text-xs font-bold rounded-full px-1">
                {cart.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
