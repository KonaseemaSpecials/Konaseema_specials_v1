export const siteConfig = {
  whatsappNumber: "919121894446",

  contactPhoneDisplay: "+91 91218 94446",

  contactEmail: "konaseemaspecials4@gmail.com",

  instagramHandle: "",

  instagramUrl: "",
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
