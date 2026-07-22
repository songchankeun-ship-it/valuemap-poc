import type { WatchlistItem } from "@/lib/watchlist";

type WatchlistCsvItem = WatchlistItem & {
  group?: string | null;
  note?: string | null;
};

// Provider-derived stock names, prices, and scores are intentionally excluded.
// This export contains only the saved ticker and user-authored watchlist metadata.
const CSV_HEADERS = ["ticker", "group", "note", "addedAt"] as const;
const UTF8_BOM = "\uFEFF";
const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;
const LEADING_CONTROL_PATTERN = /^[\t\r\n]/;

function escapeCsvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (LEADING_CONTROL_PATTERN.test(text) || FORMULA_PREFIX_PATTERN.test(text.trimStart())) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildWatchlistCsv(items: WatchlistCsvItem[]): string {
  const rows = items.map((item) => {
    return [
      item.ticker,
      item.group ?? "",
      item.note ?? "",
      item.addedAt,
    ];
  });

  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
  ];
  return `${UTF8_BOM}${lines.join("\r\n")}\r\n`;
}

export function watchlistCsvFilename(now = new Date()): string {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `ornscore-watchlist-${year}${month}${day}.csv`;
}
