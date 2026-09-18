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

  prices: Partial<
    Record<"250g" | "500g" | "1kg", number>
  >;

  weight: "250g" | "500g" | "1kg";
  price: number;
};

/* =========================================================
   FETCH PRODUCTS THROUGH OUR OWN NEXT.JS API

   Browser
      ↓
   /api/products
      ↓
   Next.js server
      ↓
   Google Sheet CSV

   This avoids fetching Google Sheets directly from
   the customer's browser.
========================================================= */

export async function getProductsFromSheet(): Promise<
  ProductFromSheet[]
> {
  try {
    const response = await fetch("/api/products", {
      method: "GET",
      cache: "no-store",
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Products API returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `Products API failed with status ${response.status}`
      );
    }

    /*
      API normally returns an array.

      Also support:
      {
        products: [...]
      }

      so future API changes do not immediately break UI.
    */
    const products = Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
      ? data.products
      : [];

    console.log(
      `Products received by browser: ${products.length}`
    );

    return products as ProductFromSheet[];
  } catch (error) {
    console.error(
      "Failed to load products:",
      error
    );

    return [];
  }
}
