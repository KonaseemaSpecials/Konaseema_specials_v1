const COMBO_SHEET_URL =
  process.env.NEXT_PUBLIC_COMBO_SHEET_URL?.trim();

export type ComboItem = {
  name: string;
  weight: string;
};

export type ComboProduct = {
  id: string;
  name: string;

  category: "Combos & Value Packs";

  image: string;

  price: number;

  /*
    Shipping weight.
  */
  weight: string;

  /*
    Original Google Sheet value.
  */
  total_weight: string;

  is_combo: true;

  items: ComboItem[];
};

/* =========================================================
   NORMALIZE GOOGLE SHEET COLUMN NAMES

   Examples:
   Combo ID     -> combo_id
   combo_id     -> combo_id
   Combo Price  -> combo_price
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

   Handles Google Sheets CSV correctly:
   - quoted commas
   - quotes
   - multiline cells
   - CRLF
   - empty cells

   No external package required.
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

    // Quote handling
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    // Column separator
    if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";

      continue;
    }

    // New row
    if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
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

  // Final row
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

      result[header] = String(
        columns[index] ?? ""
      ).trim();
    });

    return result;
  });
}

/* =========================================================
   PRICE CONVERTER
========================================================= */
function toNum(value: any): number {
  const original = String(value ?? "").trim();

  if (!original) {
    return 0;
  }

  const cleaned = original.replace(
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
   FETCH COMBOS FROM GOOGLE SHEET
========================================================= */
export async function getCombosFromSheet(): Promise<
  ComboProduct[]
> {
  if (!COMBO_SHEET_URL) {
    console.error(
      "Missing NEXT_PUBLIC_COMBO_SHEET_URL environment variable"
    );

    return [];
  }

  try {
    const response = await fetch(
      COMBO_SHEET_URL,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Combo sheet request failed: ${response.status} ${response.statusText}`
      );
    }

    /*
      IMPORTANT:

      The environment variable uses:

      export?format=csv

      Therefore Google returns CSV, NOT GViz JSON.
    */
    const csvText = await response.text();

    if (!csvText.trim()) {
      console.warn(
        "Combo Google Sheet returned empty CSV."
      );

      return [];
    }

    const rows = parseCSV(csvText);

    console.log(
      `Google Sheet combo rows received: ${rows.length}`
    );

    const comboMap: Record<
      string,
      ComboProduct
    > = {};

    for (const row of rows) {
      const comboId = String(
        row.combo_id ?? ""
      ).trim();

      /*
        Skip empty Google Sheet rows.
      */
      if (!comboId) {
        continue;
      }

      const comboName = String(
        row.combo_name ?? ""
      ).trim();

      const comboImage = String(
        row.combo_image ?? ""
      ).trim();

      const comboPrice = toNum(
        row.combo_price
      );

      const totalWeight = String(
        row.total_weight ?? ""
      ).trim();

      /*
        Create combo only once.

        Multiple Google Sheet rows with the same
        combo_id become multiple items inside
        the same combo.
      */
      if (!comboMap[comboId]) {
        comboMap[comboId] = {
          id: comboId,

          name:
            comboName ||
            `Combo ${comboId}`,

          category:
            "Combos & Value Packs",

          image: comboImage,

          price: comboPrice,

          weight: totalWeight,

          total_weight: totalWeight,

          is_combo: true,

          items: [],
        };
      }

      /*
        In case first row didn't contain some
        combo-level information, allow a later
        row to fill it.
      */
      if (
        !comboMap[comboId].image &&
        comboImage
      ) {
        comboMap[comboId].image =
          comboImage;
      }

      if (
        comboMap[comboId].price <= 0 &&
        comboPrice > 0
      ) {
        comboMap[comboId].price =
          comboPrice;
      }

      if (
        !comboMap[comboId].total_weight &&
        totalWeight
      ) {
        comboMap[comboId].total_weight =
          totalWeight;

        comboMap[comboId].weight =
          totalWeight;
      }

      /*
        Add item into combo.
      */
      const itemName = String(
        row.item_name ?? ""
      ).trim();

      const itemWeight = String(
        row.item_weight ?? ""
      ).trim();

      if (itemName) {
        comboMap[comboId].items.push({
          name: itemName,
          weight: itemWeight,
        });
      }
    }

    const combos =
      Object.values(comboMap);

    console.log(
      `Valid combos loaded: ${combos.length}`
    );

    return combos;
  } catch (error) {
    console.error(
      "Failed to load combos from Google Sheet:",
      error
    );

    return [];
  }
}
