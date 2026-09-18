"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { useCart } from "./CartContext";
import {
  getWhatsAppUrl,
  siteConfig,
} from "../lib/siteConfig";

/* =========================================================
   WHATSAPP LOGO

   Custom SVG so we get an actual WhatsApp-style icon
   instead of the generic Lucide MessageCircle icon.
========================================================= */

function WhatsAppIcon({
  size = 22,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.52 2 2.03 6.45 2.03 11.93c0 1.75.46 3.46 1.34 4.96L2 22l5.25-1.36a10.07 10.07 0 0 0 4.78 1.21h.01c5.52 0 10.01-4.45 10.01-9.93C22.05 6.45 17.56 2 12.04 2Zm0 18.17h-.01a8.38 8.38 0 0 1-4.27-1.16l-.31-.18-3.12.81.83-3.02-.2-.31a8.17 8.17 0 0 1-1.27-4.38c0-4.56 3.75-8.27 8.36-8.27 4.6 0 8.35 3.71 8.35 8.27-.01 4.56-3.75 8.24-8.36 8.24Zm4.59-6.19c-.25-.12-1.49-.73-1.72-.81-.23-.08-.4-.12-.57.12-.17.25-.65.81-.8.98-.15.17-.29.19-.55.06-.25-.12-1.06-.39-2.02-1.24a7.58 7.58 0 0 1-1.4-1.73c-.15-.25-.02-.38.11-.5.11-.11.25-.29.38-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.36-.78-1.86-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.85-.88 2.07 0 1.22.9 2.4 1.02 2.57.13.17 1.76 2.68 4.27 3.75.6.26 1.06.41 1.43.52.6.19 1.14.16 1.57.1.48-.07 1.49-.6 1.7-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

export default function Navbar() {
  const cart = useCart();
  const router = useRouter();

  const goToSection = (
    id: string
  ) => {
    router.push(`/#${id}`);
  };

  const whatsappMessage =
    "Hi Konaseema Specials, I would like to know more about your products.";

  const whatsappUrl =
    getWhatsAppUrl(
      whatsappMessage
    );

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
        {/* =================================================
            LOGO
        ================================================== */}

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

        {/* =================================================
            DESKTOP LINKS
        ================================================== */}

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
              goToSection(
                "home"
              )
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
              goToSection(
                "about"
              )
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

        {/* =================================================
            RIGHT SIDE
            WhatsApp + Cart
        ================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
          "
        >
          {/* ===============================================
              WHATSAPP
          ================================================ */}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            title="WhatsApp"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#25D366]
              text-white
              shadow-sm
              transition-all
              duration-200

              hover:scale-105
              hover:bg-[#20bd5a]
              hover:shadow-md

              active:scale-95

              sm:h-11
              sm:w-11
            "
          >
            <WhatsAppIcon
              size={23}
            />
          </a>

          {/* ===============================================
              CART
          ================================================ */}

          <button
            type="button"
            onClick={
              cart.open
            }
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

            {cart.count >
              0 && (
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
                {cart.count >
                99
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
