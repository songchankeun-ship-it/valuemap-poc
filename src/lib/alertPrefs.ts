"use client";

// 미리보기(preview) 알림 종류의 ON/OFF 설정 — 로컬 저장 전용.
//
// ⚠️ 의도적 설계: 이 설정값은 어떤 발송도 트리거하지 않는다.
//    실제 메일/웹/텔레그램 발송 파이프라인이 준비되기 전까지는, 사용자가 "어떤 알림을
//    켜고 끄는 경험"만 미리 해보도록 localStorage 에만 저장한다. Supabase·cron 과
//    연결돼 있지 않으므로 이 키를 바꿔도 외부로 나가는 메시지는 없다.
//    실제 발송 파이프라인이 출시되면 이 설정을 그대로 옮겨 쓸 수 있게 id 는 alertCatalog 와 일치시킨다.
//
// 기존 savedSearches / recentViews 의 localStorage + CustomEvent 패턴을 그대로 따른다.

const LOCAL_KEY = "ornscore_alert_prefs";
export const ALERT_PREFS_EVENT = "alert-prefs-changed";

type PrefMap = Record<string, boolean>;

function readAll(): PrefMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? (obj as PrefMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: PrefMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(ALERT_PREFS_EVENT));
  } catch {
    // localStorage 불가(시크릿 등) — 조용히 무시
  }
}

/** 미리보기 알림 켜짐 여부. 기본 OFF(아직 실제 발송 전이므로 사용자가 명시적으로 켜는 경험). */
export function getAlertPref(id: string): boolean {
  return readAll()[id] === true;
}

export function setAlertPref(id: string, on: boolean) {
  const map = readAll();
  map[id] = on;
  writeAll(map);
}
