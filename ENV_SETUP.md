# Environment variables

This build is frontend-only. It has no Supabase, authentication, or database dependency.

Add these in Vercel: **Project → Settings → Environment Variables**.

```env
NEXT_PUBLIC_PRODUCTS_SHEET_URL=
NEXT_PUBLIC_COMBO_SHEET_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CONTACT_PHONE_DISPLAY=
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_INSTAGRAM_HANDLE=
NEXT_PUBLIC_INSTAGRAM_URL=
```

## Notes

- `NEXT_PUBLIC_PRODUCTS_SHEET_URL`: product sheet JSON endpoint used by the storefront.
- `NEXT_PUBLIC_COMBO_SHEET_URL`: combo sheet GViz endpoint.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: digits only including country code, e.g. `919876543210`.
- `NEXT_PUBLIC_CONTACT_PHONE_DISPLAY`: formatted number shown to customers, e.g. `+91 98765 43210`.
- Contact details are not hardcoded in React components.
- Checkout prepares the order and opens WhatsApp; it does not save orders to a backend.
- The navbar has no Custom Order or WhatsApp action buttons; it keeps navigation and cart only.
- A floating WhatsApp icon appears at the bottom-right when `NEXT_PUBLIC_WHATSAPP_NUMBER` is configured.
- After changing Vercel environment variables, redeploy the project.
