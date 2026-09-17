"use client";

import { getWhatsAppUrl, siteConfig } from "../lib/siteConfig";

export default function Footer() {
  return (
    <footer id="contact" className="px-6 pt-16 pb-10 border-t border-gold bg-cream">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <div className="brand-logo text-3xl mb-3">Konaseema Specials</div>
          <p className="opacity-80">
            Authentic traditional sweets & snacks. Freshly prepared and packed with care.
          </p>
        </div>

        <div>
          <h4 className="text-xl mb-3">Contact</h4>
          <div className="opacity-80 space-y-2">
            {siteConfig.contactEmail && (
              <div>Email: <a className="underline" href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a></div>
            )}
            {siteConfig.whatsappNumber && (
              <div>WhatsApp: <a className="underline" href={getWhatsAppUrl()} target="_blank" rel="noreferrer">{siteConfig.contactPhoneDisplay || siteConfig.whatsappNumber}</a></div>
            )}
            {siteConfig.instagramHandle && (
              <div>Instagram: <a className="underline" href={siteConfig.instagramUrl || "#"} target="_blank" rel="noreferrer">{siteConfig.instagramHandle}</a></div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xl mb-3">Policies</h4>
          <ul className="opacity-80 space-y-2">
            <li><a className="underline" href="#">Return & Refund Policy</a></li>
            <li><a className="underline" href="#">Delivery Policy</a></li>
            <li><a className="underline" href="#">Privacy Policy</a></li>
            <li><a className="underline" href="#">Terms & Conditions</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xl mb-3">Quick Order</h4>
          <p className="opacity-80 mb-4">Order instantly via WhatsApp.</p>
          {siteConfig.whatsappNumber && (
            <a className="btn-primary inline-block bg-green-700 hover:bg-green-800" href={getWhatsAppUrl()} target="_blank" rel="noreferrer">
              WhatsApp Now
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-gold opacity-70 text-sm flex flex-wrap gap-3 justify-between">
        <span>© {new Date().getFullYear()} Konaseema Specials. All rights reserved.</span>
        <span>Made with love in Konaseema ❤️ </span>
      </div>
    </footer>
  );
}
