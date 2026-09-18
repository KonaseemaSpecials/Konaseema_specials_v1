import { NextResponse } from "next/server";

/*
  Never cache Google Sheet product data.
*/
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   GOOGLE SHEET URL

   First preference:
   PRODUCTS_SHEET_URL

   Second preference:
   NEXT_PUBLIC_PRODUCTS_SHEET_URL

   Final fallback:
   Your current Google Sheet.
========================================================= */

const DEFAULT_PRODUCTS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1VfHHO5eN8xHn8MNtmFWdgAXv7SuIt1Bs71SITE7lc_I/export?format=csv&gid=0";

/* =========================================================
   TYPES
========================================================= */

type ProductFromSheet = {
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

type CSVRow = Record<string, string>;

/* =========================================================
   NORMALIZE COLUMN HEADERS

   These all become predictable:

   Product ID       → product_id
   product id       → product_id
   PRODUCT-ID       → product_id
   Price 250g USD   → price_250g_usd
========================================================= */

function normalizeHeader(value: string): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* =========================================================
   CSV PARSER

   Important:
   DO NOT use csv.split(",")

   Product descriptions/names can contain commas.

   This parser handles:

   - commas inside quoted values
   - escaped quotes ""
   - multiline cells
   - Windows \r\n
   - Google Sheets CSV
========================================================= */

function parseCSV(csvText: string): CSVRow[] {
  const text = String(csvText ?? "")
    .replace(/^\uFEFF/, "");

  const allRows: string[][] = [];

  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    /*
      Quoted values
    */
    if (char === '"') {
      /*
        "" inside a quoted cell means
        literal "
      */
      if (
        insideQuotes &&
        nextChar === '"'
      ) {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    /*
      Comma = next column,
      but only when outside quotes.
    */
    if (
      char === "," &&
      !insideQuotes
    ) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    /*
      New line = next row,
      but only outside quotes.
    */
    if (
      (char === "\n" ||
        char === "\r") &&
      !insideQuotes
    ) {
      /*
        Windows CRLF
      */
      if (
        char === "\r" &&
        nextChar === "\n"
      ) {
        i++;
      }

      currentRow.push(currentCell);

      const rowHasContent =
        currentRow.some(
          (value) =>
            String(value ?? "").trim() !== ""
        );

      if (rowHasContent) {
        allRows.push(currentRow);
      }

      currentRow = [];
      currentCell = "";

      continue;
    }

    currentCell += char;
  }

  /*
    Final row
  */
  if (
    currentCell.length > 0 ||
    currentRow.length > 0
  ) {
    currentRow.push(currentCell);

    const rowHasContent =
      currentRow.some(
        (value) =>
          String(value ?? "").trim() !== ""
      );

    if (rowHasContent) {
      allRows.push(currentRow);
    }
  }

  if (allRows.length === 0) {
    return [];
  }

  /*
    First row = headers
  */
  const headers =
    allRows[0].map(normalizeHeader);

  /*
    Convert rows to objects
  */
  return allRows
    .slice(1)
    .map((columns) => {
      const row: CSVRow = {};

      headers.forEach(
        (header, index) => {
          if (!header) return;

          row[header] = String(
            columns[index] ?? ""
          ).trim();
        }
      );

      return row;
    });
}

/* =========================================================
   GET FIRST MATCHING COLUMN

   Allows different Google Sheet heading names.

   Example:

   product_id
   id
   sku

   can all be accepted.
========================================================= */

function pick(
  row: CSVRow,
  keys: string[]
): string {
  for (const key of keys) {
    const normalized =
      normalizeHeader(key);

    const value = row[normalized];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return "";
}

/* =========================================================
   NUMBER CONVERSION

   Supports:

   12
   12.99
   $12.99
   USD 12.99
   1,299.99
========================================================= */

function toNumber(value: any): number {
  const raw = String(
    value ?? ""
  ).trim();

  if (!raw) {
    return 0;
  }

  const cleaned = raw.replace(
    /[^0-9.-]/g,
    ""
  );

  if (!cleaned) {
    return 0;
  }

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =========================================================
   BOOLEAN CONVERSION

   TRUE VALUES:
   true
   1
   yes
   y
   live
   active

   FALSE VALUES:
   false
   0
   no
   n
   inactive
   hidden
========================================================= */

function toBoolean(
  value: any,
  fallback: boolean
): boolean {
  const raw = String(
    value ?? ""
  )
    .trim()
    .toLowerCase();

  if (!raw) {
    return fallback;
  }

  if (
    [
      "true",
      "1",
      "yes",
      "y",
      "live",
      "active",
      "available",
    ].includes(raw)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
      "inactive",
      "hidden",
      "disabled",
    ].includes(raw)
  ) {
    return false;
  }

  return fallback;
}

/* =========================================================
   CREATE STABLE ID WHEN ID COLUMN IS EMPTY
========================================================= */

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================================================
   CHECK IF GOOGLE RETURNED HTML INSTEAD OF CSV

   This usually happens when:
   - sheet is private
   - Google redirects to login
   - sharing is not configured correctly
========================================================= */

function looksLikeHTML(
  text: string
): boolean {
  const start = String(text ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 500);

  return (
    start.startsWith("<!doctype html") ||
    start.startsWith("<html") ||
    start.includes("<head>") ||
    start.includes(
      "accounts.google.com"
    )
  );
}

/* =========================================================
   CONVERT ONE GOOGLE SHEET ROW TO PRODUCT
========================================================= */

function rowToProduct(
  row: CSVRow,
  rowIndex: number
): ProductFromSheet | null {
  /* -------------------------
     NAME
  ------------------------- */

  const name = pick(row, [
    "product_name",
    "name",
    "title",
    "product",
  ]);

  /*
    Completely empty row.
  */
  if (!name) {
    return null;
  }

  /* -------------------------
     ID
  ------------------------- */

  const rawId = pick(row, [
    "product_id",
    "id",
    "sku",
    "product_code",
    "code",
  ]);

  const id =
    rawId ||
    `${slugify(name)}-${rowIndex + 1}`;

  /* -------------------------
     CATEGORY
  ------------------------- */

  const category =
    pick(row, [
      "category",
      "product_category",
      "parent_category",
      "catalog",
    ]) || "Other";

  /* -------------------------
     DESCRIPTION
  ------------------------- */

  const desc = pick(row, [
    "description",
    "desc",
    "product_description",
    "details",
  ]);

  /* -------------------------
     IMAGE
  ------------------------- */

  const image = pick(row, [
    "image_url",
    "image",
    "image_link",
    "imageurl",
    "photo_url",
    "photo",
  ]);

  /* -------------------------
     250g PRICE
  ------------------------- */

  let price250 = toNumber(
    pick(row, [
      "price_250g_usd",
      "250g_usd",
      "price_250g",
      "250g",
      "250_g",
    ])
  );

  /* -------------------------
     500g PRICE
  ------------------------- */

  let price500 = toNumber(
    pick(row, [
      "price_500g_usd",
      "500g_usd",
      "price_500g",
      "500g",
      "500_g",
    ])
  );

  /* -------------------------
     1kg PRICE
  ------------------------- */

  let price1kg = toNumber(
    pick(row, [
      "price_1kg_usd",
      "1kg_usd",
      "price_1kg",
      "1kg",
      "1_kg",
      "1000g",
    ])
  );

  /* =====================================================
     FALLBACK FOR SHEETS USING:

     size | price

     instead of separate:
     250g | 500g | 1kg
  ===================================================== */

  const genericPrice = toNumber(
    pick(row, [
      "price_usd",
      "selling_price_usd",
      "selling_price",
      "seller_price",
      "price",
    ])
  );

  const genericSize = pick(row, [
    "size",
    "weight",
    "pack_size",
    "pack",
  ])
    .toLowerCase()
    .replace(/\s+/g, "");

  if (
    price250 <= 0 &&
    price500 <= 0 &&
    price1kg <= 0 &&
    genericPrice > 0
  ) {
    if (
      genericSize === "250g" ||
      genericSize === "250gm"
    ) {
      price250 = genericPrice;
    } else if (
      genericSize === "500g" ||
      genericSize === "500gm"
    ) {
      price500 = genericPrice;
    } else {
      /*
        Existing website only supports
        250g / 500g / 1kg product variants.

        If no matching size is supplied,
        use 1kg as the default slot so
        the product still displays.
      */
      price1kg = genericPrice;
    }
  }

  const prices: ProductFromSheet["prices"] =
    {
      "250g": price250,
      "500g": price500,
      "1kg": price1kg,
    };

  /* -------------------------
     DEFAULT WEIGHT
  ------------------------- */

  let defaultWeight:
    | "250g"
    | "500g"
    | "1kg" = "1kg";

  if (price250 > 0) {
    defaultWeight = "250g";
  } else if (price500 > 0) {
    defaultWeight = "500g";
  } else if (price1kg > 0) {
    defaultWeight = "1kg";
  }

  /* -------------------------
     STOCK
  ------------------------- */

  let outOfStock = toBoolean(
    pick(row, [
      "out_of_stock",
      "outofstock",
      "sold_out",
    ]),
    false
  );

  /*
    Also understand a numeric stock column.

    stock = 0 → out of stock
    stock = 10 → available
  */
  const stockValue = pick(row, [
    "stock",
    "quantity",
    "inventory",
  ]);

  if (stockValue !== "") {
    const stockNumber =
      toNumber(stockValue);

    if (stockNumber <= 0) {
      outOfStock = true;
    }
  }

  /* -------------------------
     LIVE / ACTIVE
  ------------------------- */

  const isLive = toBoolean(
    pick(row, [
      "is_live",
      "live",
      "active",
      "is_active",
      "published",
    ]),
    true
  );

  return {
    id,
    name,
    category,
    desc,
    image,

    out_of_stock: outOfStock,

    is_live: isLive,

    prices,

    weight: defaultWeight,

    price:
      prices[defaultWeight] ?? 0,
  };
}

/* =========================================================
   API ROUTE
========================================================= */

export async function GET() {
  const sheetUrl =
    process.env.PRODUCTS_SHEET_URL?.trim() ||
    process.env.NEXT_PUBLIC_PRODUCTS_SHEET_URL?.trim() ||
    DEFAULT_PRODUCTS_SHEET_URL;

  try {
    console.log(
      "Fetching products from Google Sheet..."
    );

    const response = await fetch(
      sheetUrl,
      {
        method: "GET",

        cache: "no-store",

        headers: {
          Accept:
            "text/csv,text/plain,*/*",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google Sheet request failed: ${response.status} ${response.statusText}`
      );
    }

    const csvText =
      await response.text();

    if (!csvText.trim()) {
      throw new Error(
        "Google Sheet returned an empty response."
      );
    }

    if (looksLikeHTML(csvText)) {
      throw new Error(
        "Google returned an HTML/login page instead of CSV. Make sure the Google Sheet is shared as 'Anyone with the link - Viewer'."
      );
    }

    const rows =
      parseCSV(csvText);

    console.log(
      `Google product sheet rows: ${rows.length}`
    );

    if (rows.length === 0) {
      throw new Error(
        "No rows were found in the Google Sheet CSV."
      );
    }

    const products =
      rows
        .map((row, index) =>
          rowToProduct(
            row,
            index
          )
        )
        .filter(
          (
            product
          ): product is ProductFromSheet =>
            product !== null
        );

    console.log(
      `Products successfully mapped: ${products.length}`
    );

    /*
      Helpful diagnostic logging.

      You can see this in:
      terminal locally
      or
      Vercel → Logs
    */
    if (products.length === 0) {
      console.warn(
        "CSV was downloaded but no products were mapped."
      );

      console.warn(
        "Detected sheet columns:",
        Object.keys(rows[0] || {})
      );
    }

    return NextResponse.json(
      products,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          "X-Products-Count":
            String(products.length),
        },
      }
    );
  } catch (error: any) {
    console.error(
      "PRODUCT SHEET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to load products from Google Sheet.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
