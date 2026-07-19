// 한국어 전용 공개 로케일 불변식 검증기 — Korean-only public-locale slice (정적·유한·오프라인).
// 실행: npx tsx scripts/test_localePublicInvariant.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 고정하는 계약(resolvePublicLocale, 순수 함수):
//   · 저장값 없음 → 한국어.
//   · 레거시 localStorage=en → 한국어(영어로 안 됨) + 레거시 정리 요청.
//   · 레거시 cookie=en → 한국어 + 레거시 정리 요청.
//   · 충돌하는 저장값(en/ko, ko/en) → 한국어.
//   · 명시적 ?lang=en → 영어(내부 검증 override) · ephemeral(=durable 저장 안 함).
//   · 명시적 ?lang=ko(및 잡음 쿼리) → 한국어.
//   · 영어 override 이후 재로드 → 한국어(override 가 durable 을 안 남기므로).
//   · 지속성/부작용: en override 는 durable 값을 절대 쓰지 않고, 정리는 수렴한다.
//   · 소스 수준 불변식: 일반 공개 경로는 옛 durable 상태만으로 영어가 될 수 없다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DEFAULT_LOCALE, normalizeLocale } from "../src/lib/i18n";
import {
  resolvePublicLocale,
  type PublicLocaleResolution,
} from "../src/components/LanguageProvider";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const read = (rel: string) => readFileSync(join(repo, rel), "utf8");

// 기본 전제: 공개 기본 로케일은 한국어여야 한다.
check("0 DEFAULT_LOCALE=ko", DEFAULT_LOCALE === "ko");

// durable 상태를 흉내내는 최소 모델. resolution 의 부작용은 '정리(clear)' 뿐이며
// 어떤 로케일 값도 새로 쓰지 않는다(영어를 durable 로 굳히는 쓰기 경로가 없음).
type DurableStore = { local: string | null; cookie: string | null };
function applyResolution(store: DurableStore, res: PublicLocaleResolution): DurableStore {
  if (res.clearLegacyDurable) return { local: null, cookie: null };
  return { ...store };
}

const R = (queryLang: string | null, storedLocale: string | null, cookieLocale: string | null) =>
  resolvePublicLocale({ queryLang, storedLocale, cookieLocale });

// ── 1. 저장값 없음 → 한국어 ────────────────────────────────────────────────
{
  const r = R(null, null, null);
  check("1 no stored → ko", r.locale === "ko");
  check("1 no stored → source=default", r.source === "default");
  check("1 no stored → clear 불필요", r.clearLegacyDurable === false);
  check("1 no stored → ephemeral 아님", r.ephemeralOverride === false);
}

// ── 2. 레거시 localStorage=en → 한국어 + 레거시 정리 ─────────────────────────
for (const v of ["en", "EN", "en-US", "  en  "]) {
  const r = R(null, v, null);
  check(`2 legacy localStorage="${v}" → ko`, r.locale === "ko");
  check(`2 legacy localStorage="${v}" → clear 요청`, r.clearLegacyDurable === true);
  check(`2 legacy localStorage="${v}" → source=default`, r.source === "default");
}

// ── 3. 레거시 cookie=en → 한국어 + 레거시 정리 ──────────────────────────────
for (const v of ["en", "EN", "en-US"]) {
  const r = R(null, null, v);
  check(`3 legacy cookie="${v}" → ko`, r.locale === "ko");
  check(`3 legacy cookie="${v}" → clear 요청`, r.clearLegacyDurable === true);
}

// ── 4. 충돌하는 저장값 → 한국어 ─────────────────────────────────────────────
for (const [s, c] of [["en", "ko"], ["ko", "en"], ["en", "en"], ["en-US", "ko"]] as const) {
  const r = R(null, s, c);
  check(`4 conflict local=${s}/cookie=${c} → ko`, r.locale === "ko");
  check(`4 conflict local=${s}/cookie=${c} → clear 요청`, r.clearLegacyDurable === true);
  check(`4 conflict local=${s}/cookie=${c} → ephemeral 아님`, r.ephemeralOverride === false);
}

// ── 5. 명시적 ?lang=en → 영어(내부 override) · ephemeral ────────────────────
for (const q of ["en", "EN", "en-US", " en "]) {
  const r = R(q, "en", "en");
  check(`5 ?lang=${JSON.stringify(q)} → en`, r.locale === "en");
  check(`5 ?lang=${JSON.stringify(q)} → ephemeralOverride`, r.ephemeralOverride === true);
  check(`5 ?lang=${JSON.stringify(q)} → source=query-en`, r.source === "query-en");
  check(`5 ?lang=${JSON.stringify(q)} → durable 정리 안 함`, r.clearLegacyDurable === false);
}

// ── 6. 명시적 ?lang=ko(및 잡음 쿼리) → 한국어 ───────────────────────────────
for (const q of ["ko", "KO", "fr", "garbage", "12"]) {
  const r = R(q, "en", "en"); // 레거시 en durable 이 있어도 무시하고 한국어.
  check(`6 ?lang="${q}" → ko`, r.locale === "ko");
  check(`6 ?lang="${q}" → source=query-ko`, r.source === "query-ko");
  check(`6 ?lang="${q}" → 레거시 정리 요청`, r.clearLegacyDurable === true);
  check(`6 ?lang="${q}" → ephemeral 아님`, r.ephemeralOverride === false);
}
// 빈/공백 쿼리는 쿼리 없음과 동일하게 취급(default 경로) — 여전히 한국어.
for (const q of ["", "   "]) {
  const r = R(q, null, null);
  check(`6 빈 쿼리 ${JSON.stringify(q)} → default 경로 ko`, r.locale === "ko" && r.source === "default");
}

// ── 7. 영어 override 이후 재로드 → 한국어(durable 미저장) ────────────────────
{
  // 레거시 en durable 을 가진 방문자가 내부 검증용 ?lang=en 로 진입.
  let store: DurableStore = { local: "en", cookie: "en" };
  const view1 = R("en", store.local, store.cookie);
  check("7 override 뷰 → en", view1.locale === "en" && view1.ephemeralOverride === true);
  store = applyResolution(store, view1);
  check("7 override 는 durable 을 쓰지도 지우지도 않음", store.local === "en" && store.cookie === "en");

  // 재로드(일반 네비, 쿼리 없음) → 한국어 + 레거시 정리.
  const reload = R(null, store.local, store.cookie);
  check("7 reload 후 → ko", reload.locale === "ko");
  check("7 reload 후 → 레거시 정리", reload.clearLegacyDurable === true);
  store = applyResolution(store, reload);
  check("7 reload 후 durable 비워짐", store.local === null && store.cookie === null);

  // 그 다음 재로드 → 여전히 한국어, 더는 정리할 것 없음(수렴).
  const reload2 = R(null, store.local, store.cookie);
  check("7 reload2 → ko & 정리 수렴", reload2.locale === "ko" && reload2.clearLegacyDurable === false);
}

// ── 8. 지속성/부작용 계약 ───────────────────────────────────────────────────
{
  // (a) 영어 override 는 어떤 durable 조합에서도 정리조차 하지 않는다(순수 일회성).
  for (const [s, c] of [[null, null], ["en", "en"], ["ko", null], [null, "en"]] as const) {
    const r = R("en", s, c);
    check(`8a ?lang=en durable(${s}/${c}) → clear 안 함`, r.clearLegacyDurable === false);
    check(`8a ?lang=en durable(${s}/${c}) → en/ephemeral`, r.locale === "en" && r.ephemeralOverride === true);
  }
  // (b) 정리는 두 번의 resolve 안에 수렴한다(무한 부작용 없음).
  let store: DurableStore = { local: "en", cookie: "en" };
  const first = R(null, store.local, store.cookie);
  store = applyResolution(store, first);
  const second = R(null, store.local, store.cookie);
  check("8b 정리는 1회 후 수렴", first.clearLegacyDurable === true && second.clearLegacyDurable === false);
  // (c) resolution 타입에는 durable '값 쓰기' 개념이 없다 — 부작용은 clear 뿐.
  const keys = Object.keys(first) as (keyof PublicLocaleResolution)[];
  check("8c resolution 필드 = locale/ephemeralOverride/clearLegacyDurable/source",
    keys.length === 4 &&
    keys.includes("locale") && keys.includes("ephemeralOverride") &&
    keys.includes("clearLegacyDurable") && keys.includes("source"));
}

// ── 9. 소스 수준 불변식: 일반 공개 경로는 옛 durable 만으로 영어가 될 수 없다 ──
// (a) 행위 증명 — 쿼리 없는 durable 전 조합을 전수 검사.
const DURABLE_VALUES = [null, "en", "EN", "en-US", "  en  ", "ko", "KO", "fr", "", "garbage"];
let matrixCount = 0;
let sawLegacyClear = false;
for (const s of DURABLE_VALUES) {
  for (const c of DURABLE_VALUES) {
    const r = R(null, s, c);
    matrixCount++;
    check(`9a default[local=${JSON.stringify(s)},cookie=${JSON.stringify(c)}] → ko`, r.locale === "ko");
    check(`9a default[...] → ephemeral 아님`, r.ephemeralOverride === false);
    // 정리 요청은 오직 레거시(비-ko) 값이 있을 때만.
    const expectClear =
      (s != null && normalizeLocale(s) !== DEFAULT_LOCALE) ||
      (c != null && normalizeLocale(c) !== DEFAULT_LOCALE);
    check(`9a default[...] clear==레거시존재`, r.clearLegacyDurable === expectClear);
    if (expectClear) sawLegacyClear = true;
  }
}
check(`9a 전수 매트릭스 실행됨(${matrixCount})`, matrixCount === DURABLE_VALUES.length * DURABLE_VALUES.length);
check("9a 매트릭스에 레거시 정리 경로가 실제로 등장", sawLegacyClear === true);

// (b) 텍스트 가드 — durable 로케일 '값 쓰기' 경로가 소스에 없어야 한다.
const providerSrc = read("src/components/LanguageProvider.tsx");
check("9b setItem(값 쓰기) 없음 — 한국어 기본이라 durable 저장 불필요", !providerSrc.includes("setItem("));
check("9b removeItem(정리) 존재", providerSrc.includes("removeItem(LANG_STORAGE_KEY)"));
check("9b 장수명 쿠키 없음(max-age 는 0 정리뿐)", !/max-age=\s*[1-9]/.test(providerSrc) && providerSrc.includes("max-age=0"));
check("9b resolvePublicLocale export 존재", /export function resolvePublicLocale/.test(providerSrc));
// query-en 만 영어를 반환 — default/query-ko 분기는 DEFAULT_LOCALE 을 반환한다.
check("9b query-en 분기만 locale:\"en\" 반환",
  (providerSrc.match(/locale:\s*"en"/g) || []).length === 1);

// ── 10. 자기검증: 가드가 '항상 통과'가 아님(진짜로 잡아낸다) ─────────────────
check("10 selftest: 레거시 en 은 정말 정리 대상", R(null, "en", null).clearLegacyDurable === true);
check("10 selftest: ko durable 은 정리 대상 아님", R(null, "ko", "ko").clearLegacyDurable === false);
check("10 selftest: ?lang=en 이 실제로 en 을 켠다", R("en", null, null).locale === "en");
check("10 selftest: max-age 가드가 장수명 쿠키를 잡는다", /max-age=\s*[1-9]/.test("max-age=31536000"));
check("10 selftest: setItem 가드가 값 쓰기를 잡는다", "x.setItem(LANG_STORAGE_KEY, v)".includes("setItem("));

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log(
  "PASS: Korean-only public-locale invariant (저장값 없음/레거시 localStorage=en/레거시 cookie=en/충돌 → ko · ?lang=en=ephemeral 영어 override · ?lang=ko·잡음 쿼리 → ko · override 후 재로드 → ko · 지속성 수렴·부작용은 정리뿐 · 소스 불변식 전수 매트릭스 100 + 텍스트 가드) — durable 상태만으로 공개 경로가 영어가 되지 않음",
);
