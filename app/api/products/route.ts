import { NextResponse } from "next/server";

/*
  Never cache Google Sheet product data.
*/
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   GOOGLE SHEET URL
========================================================= */

const DEFAULT_PRODUCTS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1Xe2Sro3dVo2-B6RwSKtNvh59x9YcxDMWPhtBU1NcCLI/export?format=csv&gid=1350819211";

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
========================================================= */

function parseCSV(csvText: string): CSVRow[] {
  const text = String(csvText ?? "").replace(
    /^\uFEFF/,
    ""
  );

  const allRows: string[][] = [];

  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
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

    if (
      char === "," &&
      !insideQuotes
    ) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (
      (char === "\n" ||
        char === "\r") &&
      !insideQuotes
    ) {
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
            String(
              value ?? ""
            ).trim() !== ""
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

  if (
    currentCell.length > 0 ||
    currentRow.length > 0
  ) {
    currentRow.push(currentCell);

    const rowHasContent =
      currentRow.some(
        (value) =>
          String(
            value ?? ""
          ).trim() !== ""
      );

    if (rowHasContent) {
      allRows.push(currentRow);
    }
  }

  if (allRows.length === 0) {
    return [];
  }

  const headers =
    allRows[0].map(
      normalizeHeader
    );

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
========================================================= */

function pick(
  row: CSVRow,
  keys: string[]
): string {
  for (const key of keys) {
    const normalized =
      normalizeHeader(key);

    const value =
      row[normalized];

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
========================================================= */

function toNumber(value: any): number {
  const raw = String(
    value ?? ""
  ).trim();

  if (!raw) {
    return 0;
  }

  const cleaned =
    raw.replace(
      /[^0-9.-]/g,
      ""
    );

  if (!cleaned) {
    return 0;
  }

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =========================================================
   BOOLEAN CONVERSION
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
   CREATE STABLE ID
========================================================= */

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/* =========================================================
   CHECK FOR HTML / GOOGLE LOGIN PAGE
========================================================= */

function looksLikeHTML(
  text: string
): boolean {
  const start = String(
    text ?? ""
  )
    .trim()
    .toLowerCase()
    .slice(0, 500);

  return (
    start.startsWith(
      "<!doctype html"
    ) ||
    start.startsWith(
      "<html"
    ) ||
    start.includes(
      "<head>"
    ) ||
    start.includes(
      "accounts.google.com"
    )
  );
}

/* =========================================================
   CONVERT SHEET ROW TO PRODUCT
========================================================= */

function rowToProduct(
  row: CSVRow,
  rowIndex: number
): ProductFromSheet | null {
  const name = pick(row, [
    "product_name",
    "name",
    "title",
    "product",
  ]);

  if (!name) {
    return null;
  }

  const rawId = pick(row, [
    "product_id",
    "id",
    "sku",
    "product_code",
    "code",
  ]);

  const id =
    rawId ||
    `${slugify(name)}-${
      rowIndex + 1
    }`;

  const category =
    pick(row, [
      "category",
      "product_category",
      "parent_category",
      "catalog",
    ]) || "Other";

  const desc = pick(row, [
    "description",
    "desc",
    "product_description",
    "details",
  ]);

  const image = pick(row, [
    "image_url",
    "image",
    "image_link",
    "imageurl",
    "photo_url",
    "photo",
  ]);

  let price250 = toNumber(
    pick(row, [
      "price_250g_usd",
      "250g_usd",
      "price_250g",
      "250g",
      "250_g",
    ])
  );

  let price500 = toNumber(
    pick(row, [
      "price_500g_usd",
      "500g_usd",
      "price_500g",
      "500g",
      "500_g",
    ])
  );

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

  const genericPrice =
    toNumber(
      pick(row, [
        "price_usd",
        "selling_price_usd",
        "selling_price",
        "seller_price",
        "price",
      ])
    );

  const genericSize =
    pick(row, [
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
      price250 =
        genericPrice;
    } else if (
      genericSize === "500g" ||
      genericSize === "500gm"
    ) {
      price500 =
        genericPrice;
    } else {
      price1kg =
        genericPrice;
    }
  }

  const prices: ProductFromSheet["prices"] =
    {
      "250g": price250,
      "500g": price500,
      "1kg": price1kg,
    };

  let defaultWeight:
    | "250g"
    | "500g"
    | "1kg" = "1kg";

  if (price250 > 0) {
    defaultWeight = "250g";
  } else if (
    price500 > 0
  ) {
    defaultWeight = "500g";
  } else if (
    price1kg > 0
  ) {
    defaultWeight = "1kg";
  }

  let outOfStock =
    toBoolean(
      pick(row, [
        "out_of_stock",
        "outofstock",
        "sold_out",
      ]),
      false
    );

  const stockValue =
    pick(row, [
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

  const isLive =
    toBoolean(
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

    out_of_stock:
      outOfStock,

    is_live: isLive,

    prices,

    weight:
      defaultWeight,

    price:
      prices[
        defaultWeight
      ] ?? 0,
  };
}

/* =========================================================
   API ROUTE
========================================================= */

export async function GET() {
  /*
    IMPORTANT:
    Use NEXT_PUBLIC_PRODUCTS_SHEET_URL first.

    This prevents an old PRODUCTS_SHEET_URL
    value in Vercel from overriding the
    current sheet.
  */
  const sheetUrl =
    process.env
      .NEXT_PUBLIC_PRODUCTS_SHEET_URL
      ?.trim() ||
    DEFAULT_PRODUCTS_SHEET_URL;

  try {
    console.log(
      "Fetching products from:",
      sheetUrl
    );

    const response =
      await fetch(
        sheetUrl,
        {
          method: "GET",

          cache:
            "no-store",

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

    if (
      looksLikeHTML(
        csvText
      )
    ) {
      throw new Error(
        "Google returned an HTML/login page instead of CSV. Make sure the Google Sheet is shared as 'Anyone with the link - Viewer'."
      );
    }

    const rows =
      parseCSV(
        csvText
      );

    console.log(
      `Google product sheet rows: ${rows.length}`
    );

    if (
      rows.length === 0
    ) {
      throw new Error(
        "No rows were found in the Google Sheet CSV."
      );
    }

    const products =
      rows
        .map(
          (
            row,
            index
          ) =>
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

    if (
      products.length === 0
    ) {
      console.warn(
        "CSV downloaded successfully but no products were mapped."
      );

      console.warn(
        "Detected sheet columns:",
        Object.keys(
          rows[0] || {}
        )
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
            String(
              products.length
            ),
        },
      }
    );
  } catch (
    error: any
  ) {
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
