"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { useCart } from "./CartContext";
import WhatsAppButton from "./WhatsAppButton";

export default function Navbar() {
  const cart = useCart();
  const router = useRouter();

  const goToSection = (id: string) => {
    router.push(`/#${id}`);
  };

  return (
    <nav
      className="
        sticky
        top-0
        z-50
        border-b
        border-gold
        bg-cream/90
        backdrop-blur-md
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
          px-4
          py-4
          md:px-6
        "
      >
        {/* =========================
            BRAND
        ========================== */}
        <Link
          href="/"
          className="
            brand-logo
            text-2xl
            font-black
            tracking-wider
            text-brown
            sm:text-3xl
            md:text-4xl
          "
          aria-label="Go to home"
        >
          Konaseema Specials
        </Link>

        {/* =========================
            DESKTOP MENU
        ========================== */}
        <div
          className="
            hidden
            items-center
            gap-8
            font-semibold
            md:flex
          "
        >
          <button
            type="button"
            onClick={() =>
              goToSection("home")
            }
            className="
              transition-colors
              hover:text-gold
            "
          >
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "categories"
              )
            }
            className="
              transition-colors
              hover:text-gold
            "
          >
            Categories
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "products"
              )
            }
            className="
              transition-colors
              hover:text-gold
            "
          >
            Products
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection("about")
            }
            className="
              transition-colors
              hover:text-gold
            "
          >
            About
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "contact"
              )
            }
            className="
              transition-colors
              hover:text-gold
            "
          >
            Contact
          </button>
        </div>

        {/* =========================
            RIGHT SIDE ACTIONS
        ========================== */}
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          {/* WhatsApp */}
          <WhatsAppButton />

          {/* Cart */}
          <button
            type="button"
            onClick={cart.open}
            aria-label="Open cart"
            title="Cart"
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              transition-all
              duration-200
              hover:bg-gold/10
              active:scale-95
            "
          >
            <ShoppingCart
              size={24}
              strokeWidth={2}
            />

            {cart.count > 0 && (
              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-5
                  min-w-[20px]
                  items-center
                  justify-center
                  rounded-full
                  bg-gold
                  px-1
                  text-xs
                  font-bold
                  text-brown
                "
              >
                {cart.count > 99
                  ? "99+"
                  : cart.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
