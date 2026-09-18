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
    Shipping / total combo weight
  */
  weight: string;

  /*
    Original value from sheet
  */
  total_weight: string;

  is_combo: true;

  items: ComboItem[];
};

/* =========================================================
   FETCH COMBOS THROUGH OUR NEXT.JS API

   Browser
      ↓
   /api/combos
      ↓
   Next.js server
      ↓
   Google Sheet CSV
========================================================= */

export async function getCombosFromSheet(): Promise<
  ComboProduct[]
> {
  try {
    const response = await fetch("/api/combos", {
      method: "GET",
      cache: "no-store",
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Combos API returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `Combos API failed with status ${response.status}`
      );
    }

    const combos = Array.isArray(data)
      ? data
      : Array.isArray(data?.combos)
      ? data.combos
      : [];

    console.log(
      `Combos received by browser: ${combos.length}`
    );

    return combos as ComboProduct[];
  } catch (error) {
    console.error(
      "Failed to load combos:",
      error
    );

    return [];
  }
}
