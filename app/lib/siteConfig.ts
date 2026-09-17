const clean = (value?: string) => (value ?? "").trim();

export const siteConfig = {
  whatsappNumber: clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER).replace(/[^0-9]/g, ""),
  contactPhoneDisplay: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY),
  contactEmail: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  instagramHandle: clean(process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE),
  instagramUrl: clean(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
};

export function getWhatsAppUrl(message?: string) {
  if (!siteConfig.whatsappNumber) return "#";
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
