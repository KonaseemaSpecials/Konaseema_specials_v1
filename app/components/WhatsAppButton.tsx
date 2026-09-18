"use client";

import { getWhatsAppUrl, siteConfig } from "../lib/siteConfig";

export default function WhatsAppButton() {
  if (!siteConfig.whatsappNumber) {
    return null;
  }

  const message =
    "Hi, I would like to know more about the products and place an order.";

  return (
    <a
      href={getWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Godavari Basket"
      title="Chat with us"
      className="
        relative
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        bg-[#173F35]
        text-white
        shadow-sm
        transition-all
        duration-200
        hover:scale-105
        hover:shadow-md
        active:scale-95
      "
    >
      {/* Thought Bubble */}
      <span
        className="
          flex
          items-center
          justify-center
          text-[23px]
          leading-none
        "
        aria-hidden="true"
      >
        💭
      </span>

      {/* Online indicator */}
      <span
        className="
          absolute
          right-0
          top-0
          h-2.5
          w-2.5
          rounded-full
          border-2
          border-white
          bg-[#22c55e]
        "
      />
    </a>
  );
}
