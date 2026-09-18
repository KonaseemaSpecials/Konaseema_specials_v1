const clean = (value?: string) => (value ?? "").trim();

export const siteConfig = {
  // WhatsApp number — removes +, spaces, brackets, etc.
  // Example: +91 91218 94446 → 919121894446
  whatsappNumber: clean(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  ).replace(/[^0-9]/g, ""),

  // Number displayed on website
  contactPhoneDisplay: clean(
    process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY
  ),

  // Contact email
  contactEmail: clean(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL
  ),

  // Instagram username
  instagramHandle: clean(
    process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE
  ),

  // Instagram profile URL
  instagramUrl: clean(
    process.env.NEXT_PUBLIC_INSTAGRAM_URL
  ),
};

export function getWhatsAppUrl(message?: string) {
  const number = siteConfig.whatsappNumber;

  if (!number) {
    return "#";
  }

  const base = `https://wa.me/${number}`;

  if (!message) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(message)}`;
}

export function getEmailUrl(
  subject?: string,
  body?: string
) {
  const email = siteConfig.contactEmail;

  if (!email) {
    return "#";
  }

  const params = new URLSearchParams();

  if (subject) {
    params.set("subject", subject);
  }

  if (body) {
    params.set("body", body);
  }

  const query = params.toString();

  return `mailto:${email}${query ? `?${query}` : ""}`;
}
