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
   NORMALIZE GOOGLE SHEET COLUMN NAMES

   Examples:
   Product ID     -> product_id
   product_id     -> product_id
   Price 250g USD -> price_250g_usd
========================================================= */
function normalizeHeader(value: string) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "");
}

/* =========================================================
   CSV PARSER

   Handles:
   - commas inside quoted values
   - quotes
   - multi-line descriptions
   - Windows/Mac line endings
   - Google Sheets CSV output

   No external npm package required.
========================================================= */
function parseCSV(csvText: string): Record<string, string>[] {
  const text = csvText.replace(/^\uFEFF/, "");

  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    // Handle quotes
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: ""
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    // Handle comma separator
    if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    // Handle new line
    if ((char === "\n" || char === "\r") && !insideQuotes) {
      // Handle Windows \r\n
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(cell);

      const hasContent = row.some(
        (value) => String(value ?? "").trim() !== ""
      );

      if (hasContent) {
        rows.push(row);
      }

      row = [];
      cell = "";

      continue;
    }

    cell += char;
  }

  // Push final row
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);

    const hasContent = row.some(
      (value) => String(value ?? "").trim() !== ""
    );

    if (hasContent) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);

  return rows.slice(1).map((columns) => {
    const result: Record<string, string> = {};

    headers.forEach((header, index) => {
      if (!header) return;

      result[header] = String(columns[index] ?? "").trim();
    });

    return result;
  });
}

/* =========================================================
   BOOLEAN CONVERTER

   Supports:
   true
   TRUE
   yes
   Yes
   1
   y

   Also:
   false
   no
   0
========================================================= */
function toBool(value: any, fallback = false): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (
    ["true", "1", "yes", "y", "active", "live"].includes(normalized)
  ) {
    return true;
  }

  if (
    ["false", "0", "no", "n", "inactive", "hidden"].includes(normalized)
  ) {
    return false;
  }

  return fallback;
}

/* =========================================================
   NUMBER CONVERTER

   Supports values such as:

   9.99
   $9.99
   1,299.99
========================================================= */
function toNum(value: any): number {
  const original = String(value ?? "").trim();

  if (!original) {
    return 0;
  }

  const cleaned = original.replace(/[^0-9.-]/g, "");

  if (!cleaned) {
    return 0;
  }

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

/* =========================================================
   GET PRODUCTS FROM GOOGLE SHEET
========================================================= */
export async function getProductsFromSheet(): Promise<
  ProductFromSheet[]
> {
  if (!SHEET_URL) {
    console.error(
      "Missing NEXT_PUBLIC_PRODUCTS_SHEET_URL environment variable"
    );

    return [];
  }

  try {
    const response = await fetch(SHEET_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Product sheet request failed: ${response.status} ${response.statusText}`
      );
    }

    /*
      IMPORTANT:

      Google is returning CSV.

      Do NOT use:
      await response.json()

      We must read the response as text.
    */
    const csvText = await response.text();

    if (!csvText.trim()) {
      console.warn("Product Google Sheet returned empty CSV.");
      return [];
    }

    const rows = parseCSV(csvText);

    console.log(
      `Google Sheet products received: ${rows.length}`
    );

    const products: ProductFromSheet[] = rows
      .map((row) => {
        const id = String(row.product_id ?? "").trim();

        const name = String(
          row.product_name ?? ""
        ).trim();

        const category = String(
          row.category ?? ""
        ).trim();

        const description = String(
          row.description ?? ""
        ).trim();

        const image = String(
          row.image_url ?? ""
        ).trim();

        const prices: ProductFromSheet["prices"] = {
          "250g": toNum(row.price_250g_usd),
          "500g": toNum(row.price_500g_usd),
          "1kg": toNum(row.price_1kg_usd),
        };

        /*
          Pick the first available size as the default
          product-card price.
        */
        let defaultWeight: ProductFromSheet["weight"];

        if ((prices["250g"] ?? 0) > 0) {
          defaultWeight = "250g";
        } else if ((prices["500g"] ?? 0) > 0) {
          defaultWeight = "500g";
        } else {
          defaultWeight = "1kg";
        }

        const product: ProductFromSheet = {
          id,
          name,
          category,
          desc: description,
          image,

          out_of_stock: toBool(
            row.out_of_stock,
            false
          ),

          /*
            Blank is_live defaults to TRUE.

            This prevents products disappearing simply
            because the cell was left empty.
          */
          is_live: toBool(
            row.is_live,
            true
          ),

          prices,

          weight: defaultWeight,

          price:
            prices[defaultWeight] ?? 0,
        };

        return product;
      })

      /*
        Ignore accidental empty rows in Google Sheets.
      */
      .filter((product) => {
        return Boolean(
          product.id &&
            product.name &&
            product.category
        );
      });

    console.log(
      `Valid products loaded: ${products.length}`
    );

    return products;
  } catch (error) {
    console.error(
      "Failed to load products from Google Sheet:",
      error
    );

    /*
      Do NOT return Test Product here.

      Returning [] makes a real Google Sheet error visible
      instead of hiding the problem.
    */
    return [];
  }
}
