"use client";

// 종목 상세 "확인 완료 체크리스트" — 사용자가 직접 확인한 항목을 이 기기에만 기록하는 단일 소스.
// recentViews.ts 규약을 그대로 따른다: SSR 가드(typeof window === "undefined"),
// 모든 localStorage 접근을 try/catch로 방어, 레거시 키 폴백, 날조 없음(로그인 동기화/외부 발송 없음).
// 저장 형태: Record<ticker, { [itemId]: true }> — 체크 해제 시 키를 지워 false를 남기지 않는다.

const CHECKLIST_KEY = "ornscore_stock_checklist";
const LEGACY_CHECKLIST_KEY = "valuemap_stock_checklist";

/** 체크리스트 항목 정의 — id는 저장 키로 쓰이므로 안정적으로 유지한다. anchor는 종목 상세 탭 해시(딥링크). */
export const CHECKLIST_ITEMS = [
  { id: "disclosure", anchor: "#disclosures" },
  { id: "earnings", anchor: "#financials" },
  { id: "value", anchor: "#basis" },
  { id: "sector", anchor: "#summary" },
] as const;

export type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]["id"];

type ChecklistStore = Record<string, Record<string, boolean>>;

function readStore(): ChecklistStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY) ?? localStorage.getItem(LEGACY_CHECKLIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ChecklistStore;
  } catch {
    return {};
  }
}

function writeStore(store: ChecklistStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(store));
    localStorage.removeItem(LEGACY_CHECKLIST_KEY);
    // watchlist-changed와 같은 패턴 — 같은 탭 내 다른 컴포넌트가 즉시 다시 읽게 알린다.
    window.dispatchEvent(new CustomEvent("stock-checklist-changed"));
  } catch {
    // 저장 불가(시크릿 모드·저장소 차단) — 이번 세션에만 반영되고 재방문 시 복원되지 않음
  }
}

/** 한 종목의 체크 상태를 SSR-safe하게 읽는다. 값이 true인 항목만 담긴 맵을 돌려준다(날조 없음). */
export function getChecklist(ticker: string): Record<string, boolean> {
  const store = readStore();
  const entry = store[ticker];
  if (!entry || typeof entry !== "object") return {};
  const out: Record<string, boolean> = {};
  for (const item of CHECKLIST_ITEMS) {
    if (entry[item.id] === true) out[item.id] = true;
  }
  return out;
}

/** 한 항목의 체크를 토글한다. 체크 해제 시 키를 지우고, 빈 종목은 스토어에서 제거한다. */
export function toggleChecklistItem(ticker: string, itemId: string): void {
  const store = readStore();
  const entry = { ...(store[ticker] ?? {}) };
  if (entry[itemId] === true) {
    delete entry[itemId];
  } else {
    entry[itemId] = true;
  }
  if (Object.keys(entry).length === 0) {
    delete store[ticker];
  } else {
    store[ticker] = entry;
  }
  writeStore(store);
}

/** 한 종목의 체크를 모두 지운다. */
export function clearChecklist(ticker: string): void {
  const store = readStore();
  if (!(ticker in store)) return;
  delete store[ticker];
  writeStore(store);
}
