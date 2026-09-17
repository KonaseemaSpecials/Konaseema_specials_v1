import "./globals.css";
import { Inter, Playfair_Display, Great_Vibes } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-greatvibes",
});

export const metadata = {
  title: "Konaseema Specials | Authentic Traditional Sweets",
  description: "Traditional Konaseema sweets made with pure ingredients",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${greatVibes.variable}`}
    >
      <body className="bg-cream text-brown">
        <div className="w-full bg-black text-white text-sm overflow-hidden">
          <div className="marquee">
            <div className="marquee__inner">
              <span className="marquee__item">
                🌿 Traditional Recipes · 🏡 Made in Konaseema · 🎁 Festive Combos · 🚚 Delivered Fresh to Your Door
              </span>
              <span className="marquee__item">
                🌿 Traditional Recipes · 🏡 Made in Konaseema · 🎁 Festive Combos · 🚚 Delivered Fresh to Your Door
              </span>
              <span className="marquee__item">
                🌿 Traditional Recipes · 🏡 Made in Konaseema · 🎁 Festive Combos · 🚚 Delivered Fresh to Your Door
              </span>
              <span className="marquee__item">
                🌿 Traditional Recipes · 🏡 Made in Konaseema · 🎁 Festive Combos · 🚚 Delivered Fresh to Your Door
              </span>
            </div>
          </div>
        </div>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
