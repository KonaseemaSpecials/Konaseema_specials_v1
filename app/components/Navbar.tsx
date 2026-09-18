"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { useCart } from "./CartContext";
import { getWhatsAppUrl } from "../lib/siteConfig";

export default function Navbar() {
  const cart = useCart();
  const router = useRouter();

  const goToSection = (id: string) => {
    router.push(`/#${id}`);
  };

  const whatsappMessage =
    "Hi Konaseema Specials, I would like to know more about your products.";

  const whatsappUrl = getWhatsAppUrl(whatsappMessage);

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
          sm:px-6
        "
      >
        {/* LOGO */}

        <Link
          href="/"
          className="
            brand-logo
            text-xl
            font-black
            tracking-wider
            text-brown
            sm:text-2xl
            md:text-4xl
          "
          aria-label="Go to home"
        >
          Konaseema Specials
        </Link>

        {/* DESKTOP LINKS */}

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
            onClick={() => goToSection("home")}
            className="
              transition-colors
              hover:text-gold
            "
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => goToSection("categories")}
            className="
              transition-colors
              hover:text-gold
            "
          >
            Categories
          </button>

          <button
            type="button"
            onClick={() => goToSection("products")}
            className="
              transition-colors
              hover:text-gold
            "
          >
            Products
          </button>

          <button
            type="button"
            onClick={() => goToSection("about")}
            className="
              transition-colors
              hover:text-gold
            "
          >
            About
          </button>

          <button
            type="button"
            onClick={() => goToSection("contact")}
            className="
              transition-colors
              hover:text-gold
            "
          >
            Contact
          </button>
        </div>

        {/* RIGHT SIDE */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-3
          "
        >
          {/* CHAT / WHATSAPP */}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us"
            title="Chat with us"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center

              text-brown

              transition-all
              duration-200

              hover:scale-110
              hover:text-gold

              active:scale-95

              sm:h-11
              sm:w-11
            "
          >
            <span
              className="
                flex
                items-center
                justify-center

                text-[26px]
                leading-none

                grayscale
                contrast-150
                sepia

                sm:text-[28px]
              "
              aria-hidden="true"
            >
              💬
            </span>
          </a>

          {/* CART */}

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

              text-brown

              transition-all
              duration-200

              hover:bg-gold/10
              hover:text-gold

              active:scale-95

              sm:h-11
              sm:w-11
            "
          >
            <ShoppingCart
              size={24}
              strokeWidth={2}
            />

            {/* CART COUNT */}

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

                  text-[11px]
                  font-bold
                  leading-none
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
