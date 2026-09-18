import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   DEFAULT COMBO GOOGLE SHEET
========================================================= */

const DEFAULT_COMBO_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1VfHHO5eN8xHn8MNtmFWdgAXv7SuIt1Bs71SITE7lc_I/export?format=csv&gid=2085765302";

/* =========================================================
   TYPES
========================================================= */

type CSVRow =
  Record<string, string>;

type ComboItem = {
  name: string;
  weight: string;
};

type ComboProduct = {
  id: string;

  name: string;

  category: "Combos & Value Packs";

  image: string;

  price: number;

  weight: string;

  total_weight: string;

  is_combo: true;

  items: ComboItem[];
};

/* =========================================================
   NORMALIZE COLUMN HEADERS
========================================================= */

function normalizeHeader(
  value: string
): string {
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

function parseCSV(
  csvText: string
): CSVRow[] {
  const text = String(
    csvText ?? ""
  ).replace(/^\uFEFF/, "");

  const allRows: string[][] = [];

  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    const char = text[i];
    const nextChar =
      text[i + 1];

    /* -------------------------
       QUOTES
    ------------------------- */

    if (char === '"') {
      if (
        insideQuotes &&
        nextChar === '"'
      ) {
        currentCell += '"';
        i++;
      } else {
        insideQuotes =
          !insideQuotes;
      }

      continue;
    }

    /* -------------------------
       COLUMN
    ------------------------- */

    if (
      char === "," &&
      !insideQuotes
    ) {
      currentRow.push(
        currentCell
      );

      currentCell = "";

      continue;
    }

    /* -------------------------
       ROW
    ------------------------- */

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

      currentRow.push(
        currentCell
      );

      const hasContent =
        currentRow.some(
          (value) =>
            String(
              value ?? ""
            ).trim() !== ""
        );

      if (hasContent) {
        allRows.push(
          currentRow
        );
      }

      currentRow = [];
      currentCell = "";

      continue;
    }

    currentCell += char;
  }

  /* -------------------------
     FINAL ROW
  ------------------------- */

  if (
    currentCell.length > 0 ||
    currentRow.length > 0
  ) {
    currentRow.push(
      currentCell
    );

    const hasContent =
      currentRow.some(
        (value) =>
          String(
            value ?? ""
          ).trim() !== ""
      );

    if (hasContent) {
      allRows.push(
        currentRow
      );
    }
  }

  if (
    allRows.length === 0
  ) {
    return [];
  }

  const headers =
    allRows[0].map(
      normalizeHeader
    );

  return allRows
    .slice(1)
    .map((columns) => {
      const row: CSVRow =
        {};

      headers.forEach(
        (header, index) => {
          if (!header) {
            return;
          }

          row[header] =
            String(
              columns[index] ??
                ""
            ).trim();
        }
      );

      return row;
    });
}

/* =========================================================
   READ FIRST AVAILABLE COLUMN
========================================================= */

function pick(
  row: CSVRow,
  keys: string[]
): string {
  for (
    const key of keys
  ) {
    const normalized =
      normalizeHeader(key);

    const value =
      row[normalized];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !==
        ""
    ) {
      return String(
        value
      ).trim();
    }
  }

  return "";
}

/* =========================================================
   PRICE
========================================================= */

function toNumber(
  value: any
): number {
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

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================================
   HTML CHECK

   Detect Google login/private sheet response.
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
   API
========================================================= */

export async function GET() {
  const sheetUrl =
    process.env.COMBO_SHEET_URL?.trim() ||
    process.env.NEXT_PUBLIC_COMBO_SHEET_URL?.trim() ||
    DEFAULT_COMBO_SHEET_URL;

  try {
    console.log(
      "Fetching combos from Google Sheet..."
    );

    const response =
      await fetch(
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
        `Google combo sheet request failed: ${response.status} ${response.statusText}`
      );
    }

    const csvText =
      await response.text();

    if (
      !csvText.trim()
    ) {
      throw new Error(
        "Google combo sheet returned an empty response."
      );
    }

    if (
      looksLikeHTML(
        csvText
      )
    ) {
      throw new Error(
        "Google returned an HTML/login page instead of combo CSV. Make sure the Sheet is shared as 'Anyone with the link - Viewer'."
      );
    }

    const rows =
      parseCSV(csvText);

    console.log(
      `Google combo sheet rows: ${rows.length}`
    );

    if (
      rows.length === 0
    ) {
      throw new Error(
        "No rows were found in the combo Google Sheet."
      );
    }

    const comboMap:
      Record<
        string,
        ComboProduct
      > = {};

    /*
      Support combo sheets where the combo ID/name
      only appears on the first row and following
      item rows are blank.

      Example:

      C01 | Godavari Combo | ...
          |                | item 2
          |                | item 3
    */

    let currentComboId = "";

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row =
        rows[index];

      /* -------------------------
         COMBO ID
      ------------------------- */

      const rowComboId =
        pick(row, [
          "combo_id",
          "bundle_id",
          "id",
          "combo_code",
        ]);

      if (rowComboId) {
        currentComboId =
          rowComboId;
      }

      /*
        No combo has started yet.
      */
      if (!currentComboId) {
        continue;
      }

      const comboId =
        currentComboId;

      /* -------------------------
         COMBO NAME
      ------------------------- */

      const comboName =
        pick(row, [
          "combo_name",
          "bundle_name",
          "name",
          "combo",
        ]);

      /* -------------------------
         IMAGE
      ------------------------- */

      const comboImage =
        pick(row, [
          "combo_image",
          "image_url",
          "image",
          "photo",
          "photo_url",
        ]);

      /* -------------------------
         PRICE
      ------------------------- */

      const comboPrice =
        toNumber(
          pick(row, [
            "combo_price",
            "price_usd",
            "bundle_price",
            "price",
          ])
        );

      /* -------------------------
         TOTAL WEIGHT
      ------------------------- */

      const totalWeight =
        pick(row, [
          "total_weight",
          "combo_weight",
          "weight",
          "shipping_weight",
        ]);

      /* =====================================================
         CREATE COMBO
      ===================================================== */

      if (
        !comboMap[
          comboId
        ]
      ) {
        comboMap[
          comboId
        ] = {
          id: comboId,

          name:
            comboName ||
            `Combo ${comboId}`,

          category:
            "Combos & Value Packs",

          image:
            comboImage,

          price:
            comboPrice,

          weight:
            totalWeight,

          total_weight:
            totalWeight,

          is_combo: true,

          items: [],
        };
      }

      const combo =
        comboMap[
          comboId
        ];

      /*
        If combo-level details were blank
        on the first row, fill them from
        later rows.
      */

      if (
        comboName &&
        (
          !combo.name ||
          combo.name.startsWith(
            "Combo "
          )
        )
      ) {
        combo.name =
          comboName;
      }

      if (
        !combo.image &&
        comboImage
      ) {
        combo.image =
          comboImage;
      }

      if (
        combo.price <= 0 &&
        comboPrice > 0
      ) {
        combo.price =
          comboPrice;
      }

      if (
        !combo.total_weight &&
        totalWeight
      ) {
        combo.total_weight =
          totalWeight;

        combo.weight =
          totalWeight;
      }

      /* =====================================================
         ITEM
      ===================================================== */

      const itemName =
        pick(row, [
          "item_name",
          "product_name",
          "item",
          "product",
        ]);

      const itemWeight =
        pick(row, [
          "item_weight",
          "product_weight",
          "item_size",
          "size",
        ]);

      if (itemName) {
        combo.items.push({
          name:
            itemName,

          weight:
            itemWeight,
        });
      }
    }

    const combos =
      Object.values(
        comboMap
      );

    console.log(
      `Combos successfully mapped: ${combos.length}`
    );

    if (
      combos.length === 0
    ) {
      console.warn(
        "Combo CSV downloaded successfully, but no combos were mapped."
      );

      console.warn(
        "Detected combo columns:",
        Object.keys(
          rows[0] || {}
        )
      );
    }

    return NextResponse.json(
      combos,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          "X-Combos-Count":
            String(
              combos.length
            ),
        },
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "COMBO SHEET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to load combos from Google Sheet.",
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
