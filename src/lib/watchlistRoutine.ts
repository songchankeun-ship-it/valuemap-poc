export const WATCHLIST_ROUTINE_SNAPSHOT_VERSION = 1 as const;

export type WatchlistRoutineStock = {
  ticker: string;
  compositeScore?: number;
  signalType?: string | null;
};

export type WatchlistRoutineSnapshotEntry = {
  score: number | null;
  signalType: string | null;
};

export type WatchlistRoutineSnapshot = {
  version: typeof WATCHLIST_ROUTINE_SNAPSHOT_VERSION;
  checkedAt: string;
  stocks: Record<string, WatchlistRoutineSnapshotEntry>;
};

export type WatchlistRoutineChange = {
  ticker: string;
  addedSinceLastCheck: boolean;
  scoreDelta: number | null;
  signalChanged: boolean;
};

function normalizedScore(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

function normalizedSignal(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 48 ? trimmed : null;
}

export function buildWatchlistRoutineSnapshot(
  stocks: readonly WatchlistRoutineStock[],
  checkedAt = new Date().toISOString(),
): WatchlistRoutineSnapshot {
  const entries = [...stocks]
    .filter((stock) => /^\d{6}$/.test(stock.ticker))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
  const snapshotStocks: Record<string, WatchlistRoutineSnapshotEntry> = {};
  for (const stock of entries) {
    snapshotStocks[stock.ticker] = {
      score: normalizedScore(stock.compositeScore),
      signalType: normalizedSignal(stock.signalType),
    };
  }
  return {
    version: WATCHLIST_ROUTINE_SNAPSHOT_VERSION,
    checkedAt,
    stocks: snapshotStocks,
  };
}

export function parseWatchlistRoutineSnapshot(raw: string | null): WatchlistRoutineSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WatchlistRoutineSnapshot>;
    if (parsed.version !== WATCHLIST_ROUTINE_SNAPSHOT_VERSION) return null;
    if (typeof parsed.checkedAt !== "string" || !Number.isFinite(Date.parse(parsed.checkedAt))) return null;
    if (!parsed.stocks || typeof parsed.stocks !== "object" || Array.isArray(parsed.stocks)) return null;

    const entries = Object.entries(parsed.stocks);
    if (entries.length > 100) return null;
    const stocks: Record<string, WatchlistRoutineSnapshotEntry> = {};
    for (const [ticker, value] of entries) {
      if (!/^\d{6}$/.test(ticker) || !value || typeof value !== "object") return null;
      const entry = value as Partial<WatchlistRoutineSnapshotEntry>;
      if (entry.score !== null && !(typeof entry.score === "number" && Number.isFinite(entry.score))) return null;
      if (entry.signalType !== null && typeof entry.signalType !== "string") return null;
      stocks[ticker] = {
        score: entry.score ?? null,
        signalType: normalizedSignal(entry.signalType),
      };
    }
    return { version: WATCHLIST_ROUTINE_SNAPSHOT_VERSION, checkedAt: parsed.checkedAt, stocks };
  } catch {
    return null;
  }
}

export function diffWatchlistRoutineSnapshot(
  snapshot: WatchlistRoutineSnapshot,
  currentStocks: readonly WatchlistRoutineStock[],
): WatchlistRoutineChange[] {
  const changes: WatchlistRoutineChange[] = [];
  for (const stock of currentStocks) {
    if (!/^\d{6}$/.test(stock.ticker)) continue;
    const currentScore = normalizedScore(stock.compositeScore);
    const currentSignal = normalizedSignal(stock.signalType);
    const previous = snapshot.stocks[stock.ticker];
    if (!previous) {
      changes.push({ ticker: stock.ticker, addedSinceLastCheck: true, scoreDelta: null, signalChanged: false });
      continue;
    }
    const scoreDelta = currentScore !== null && previous.score !== null ? currentScore - previous.score : null;
    const signalChanged = currentSignal !== previous.signalType;
    if ((scoreDelta !== null && scoreDelta !== 0) || signalChanged) {
      changes.push({ ticker: stock.ticker, addedSinceLastCheck: false, scoreDelta, signalChanged });
    }
  }
  return changes.sort((a, b) => {
    const deltaA = Math.abs(a.scoreDelta ?? 0);
    const deltaB = Math.abs(b.scoreDelta ?? 0);
    if (deltaB !== deltaA) return deltaB - deltaA;
    if (a.addedSinceLastCheck !== b.addedSinceLastCheck) return Number(b.addedSinceLastCheck) - Number(a.addedSinceLastCheck);
    if (a.signalChanged !== b.signalChanged) return Number(b.signalChanged) - Number(a.signalChanged);
    return a.ticker.localeCompare(b.ticker);
  });
}
