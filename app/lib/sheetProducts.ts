const SHEET_URL = process.env.NEXT_PUBLIC_PRODUCTS_SHEET_URL?.trim();

export type SheetProduct = {
  product_id: string;
  product_name: string;
  category: string;
  description?: string;

  price_250g_usd?: string | number;
  price_500g_usd?: string | number;
  price_1kg_usd?: string | number;

  out_of_stock?: string;
  is_live?: string;

  image_url: string;
};

export type ProductFromSheet = {
  id: string;
  name: string;
  category: string;
  desc?: string;
  image: string;
  out_of_stock: boolean;
  is_live: boolean;

  prices: Partial<Record<"250g" | "500g" | "1kg", number>>;

  weight: "250g" | "500g" | "1kg";
  price: number;
};

/* =========================================================
   TEMPORARY TEST PRODUCT 2
   Delete this object and remove TEST_PRODUCT_2 from the
   return statements below after you finish cart/toast testing.
========================================================= */
const TEST_PRODUCT_2: ProductFromSheet = {
  id: "test-product-2",
  name: "Test Product 2",
  category: "Sweets",
  desc: "Temporary test product for checking the product card, cart and toast message.",
  image: "/images/Pootharekulu.jpg",
  out_of_stock: false,
  is_live: true,
  prices: {
    "250g": 9.99,
    "500g": 17.99,
    "1kg": 32.99,
  },
  weight: "250g",
  price: 9.99,
};

const toBool = (v: any) => String(v ?? "").trim().toLowerCase() === "true";

const toNum = (v: any) => {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function cleanRowKeys<T extends Record<string, any>>(row: T): T {
  const out: any = {};
  for (const k of Object.keys(row)) out[String(k).trim()] = row[k];
  return out;
}

export async function getProductsFromSheet(): Promise<ProductFromSheet[]> {
  // Keep the temporary test product visible even before the Sheet URL is configured.
  if (!SHEET_URL) {
    return [TEST_PRODUCT_2];
  }

  try {
    const res = await fetch(SHEET_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);

    const rawRows = (await res.json()) as any[];
    const rows: SheetProduct[] = rawRows.map(cleanRowKeys);

    const products = rows.map((r) => {
      const prices: ProductFromSheet["prices"] = {
        "250g": toNum((r as any).price_250g_usd),
        "500g": toNum((r as any).price_500g_usd),
        "1kg": toNum((r as any).price_1kg_usd),
      };

      const defaultWeight: ProductFromSheet["weight"] =
        (prices["250g"] ?? 0) > 0
          ? "250g"
          : (prices["500g"] ?? 0) > 0
          ? "500g"
          : "1kg";

      return {
        id: String((r as any).product_id ?? "").trim(),
        name: String((r as any).product_name ?? "").trim(),
        category: String((r as any).category ?? "").trim(),
        desc: (r as any).description ? String((r as any).description).trim() : "",
        image: String((r as any).image_url ?? "").trim(),
        out_of_stock: toBool((r as any).out_of_stock),
        is_live: toBool((r as any).is_live ?? "true"),
        prices,
        weight: defaultWeight,
        price: prices[defaultWeight] ?? 0,
      } satisfies ProductFromSheet;
    });

    // TEMP: append Test Product 2 so it is easy to find in the product grid.
    return [...products, TEST_PRODUCT_2];
  } catch (error) {
    console.warn("Products sheet failed to load; showing Test Product 2 only.", error);
    return [TEST_PRODUCT_2];
  }
}
