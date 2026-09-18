const clean = (value?: string) =>
  (value ?? "").trim();

/*
  Fallback WhatsApp number.

  Format:
  Country code + phone number
  NO +
  NO spaces

  +91 96188 51406
  becomes:
  919618851406
*/
const DEFAULT_WHATSAPP_NUMBER = "919121894446";

export const siteConfig = {
  whatsappNumber: clean(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  ).replace(/[^0-9]/g, "") || DEFAULT_WHATSAPP_NUMBER,

  contactPhoneDisplay:
    clean(
      process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY
    ) || "+91 9121894446",

  contactEmail: clean(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL
  ),

  instagramHandle: clean(
    process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE
  ),

  instagramUrl: clean(
    process.env.NEXT_PUBLIC_INSTAGRAM_URL
  ),
};

export function getWhatsAppUrl(
  message?: string
) {
  const number =
    siteConfig.whatsappNumber;

  if (!number) {
    return "#";
  }

  const base = `https://wa.me/${number}`;

  if (!message) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(
    message
  )}`;
}
