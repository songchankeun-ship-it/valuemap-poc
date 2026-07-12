import type { WatchlistItem } from "@/lib/watchlist";

export const WATCHLIST_META_KEY = "ornscore_watchlist_meta_v1";
export const WATCHLIST_META_CHANGED_EVENT = "watchlist-meta-changed";
export const WATCHLIST_NOTE_MAX_LENGTH = 500;
export const WATCHLIST_GROUP_OPTIONS = ["관찰", "공시 확인", "재무 확인", "비교 후보"] as const;

export type WatchlistMeta = {
  group?: string;
  note?: string;
};

export type WatchlistMetaByTicker = Record<string, WatchlistMeta>;

type WatchlistItemWithMeta = WatchlistItem & WatchlistMeta;

function cleanGroup(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 40) : "";
}

function cleanNote(value: unknown): string {
  return typeof value === "string" ? value.slice(0, WATCHLIST_NOTE_MAX_LENGTH) : "";
}

export function normalizeWatchlistMeta(raw: unknown): WatchlistMetaByTicker {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const next: WatchlistMetaByTicker = {};
  for (const [ticker, value] of Object.entries(raw)) {
    if (!ticker || typeof value !== "object" || value === null || Array.isArray(value)) continue;

    const source = value as Record<string, unknown>;
    const group = cleanGroup(source.group);
    const note = cleanNote(source.note);
    if (!group && !note.trim()) continue;

    next[ticker] = {
      ...(group ? { group } : {}),
      ...(note.trim() ? { note } : {}),
    };
  }
  return next;
}

export function readWatchlistMeta(): WatchlistMetaByTicker {
  if (typeof window === "undefined") return {};
  try {
    return normalizeWatchlistMeta(JSON.parse(window.localStorage.getItem(WATCHLIST_META_KEY) ?? "{}"));
  } catch {
    return {};
  }
}

export function writeWatchlistMeta(meta: WatchlistMetaByTicker): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WATCHLIST_META_KEY, JSON.stringify(normalizeWatchlistMeta(meta)));
    window.dispatchEvent(new CustomEvent(WATCHLIST_META_CHANGED_EVENT));
  } catch {
    // Current-session state still works when browser storage is blocked.
  }
}

export function setWatchlistMetaForTicker(
  meta: WatchlistMetaByTicker,
  ticker: string,
  patch: WatchlistMeta,
): WatchlistMetaByTicker {
  const previous = meta[ticker] ?? {};
  const group = patch.group === undefined ? previous.group ?? "" : cleanGroup(patch.group);
  const note = patch.note === undefined ? previous.note ?? "" : cleanNote(patch.note);
  const item: WatchlistMeta = {
    ...(group ? { group } : {}),
    ...(note.trim() ? { note } : {}),
  };
  const next = { ...meta };
  if (item.group || item.note) next[ticker] = item;
  else delete next[ticker];
  return next;
}

export function attachWatchlistMeta<T extends WatchlistItem>(
  items: T[],
  meta: WatchlistMetaByTicker,
): (T & WatchlistItemWithMeta)[] {
  return items.map((item) => ({
    ...item,
    group: meta[item.ticker]?.group ?? "",
    note: meta[item.ticker]?.note ?? "",
  }));
}
