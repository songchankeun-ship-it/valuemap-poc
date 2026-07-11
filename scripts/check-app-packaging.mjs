// App packaging readiness gate for OrnScore.
//
// This validates the local PWA/TWA preparation files without requiring store
// accounts, Android signing fingerprints, or a running server.

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePublicStatements } from "./lib/assetlinks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => join(ROOT, p);

let fail = 0;
let wait = 0;

function pass(message) {
  console.log(`OK   ${message}`);
}

function waiting(message) {
  wait += 1;
  console.log(`WAIT ${message}`);
}

function failure(message) {
  fail += 1;
  console.log(`FAIL ${message}`);
}

function read(path) {
  return readFileSync(rel(path), "utf8");
}

function includes(path, needle, label = needle) {
  const text = read(path);
  if (text.includes(needle)) pass(`${path}: ${label}`);
  else failure(`${path}: missing ${label}`);
}

function notIncludes(path, needle, label = needle) {
  const text = read(path);
  if (!text.includes(needle)) pass(`${path}: no ${label}`);
  else failure(`${path}: contains ${label}`);
}

const icons = spawnSync(process.execPath, [rel("scripts/check-icons.mjs")], {
  cwd: ROOT,
  encoding: "utf8",
});
process.stdout.write(icons.stdout);
process.stderr.write(icons.stderr);
if (icons.status === 0) pass("PWA icon dimensions and PNG signatures");
else failure("PWA icon validation");

includes("src/app/manifest.ts", 'name: "오른스코어 — 한국 주식 탐색 도구"', "Korean app name");
includes("src/app/manifest.ts", 'short_name: "오른스코어"', "Korean short_name");
includes("src/app/manifest.ts", 'display: "standalone"', "standalone display");
includes("src/app/manifest.ts", 'start_url: "/"', "start_url /");
includes("src/app/manifest.ts", 'scope: "/"', "scope /");
includes("src/app/manifest.ts", 'lang: "ko-KR"', "ko-KR lang");
includes("src/app/manifest.ts", 'src: "/icon-192.png"', "192 icon reference");
includes("src/app/manifest.ts", 'src: "/icon-512.png"', "512 icon reference");
includes("src/app/manifest.ts", 'src: "/icon-512-maskable.png"', "maskable icon reference");
includes("src/app/manifest.ts", 'url: "/today"', "today shortcut");
includes("src/app/manifest.ts", 'url: "/stocks"', "stocks shortcut");
includes("src/app/manifest.ts", 'url: "/disclosures"', "disclosures shortcut");
notIncludes("src/app/manifest.ts", "\uFFFD", "replacement character");
notIncludes("src/app/manifest.ts", "?ㅻ", "mojibake app label");

includes("src/app/layout.tsx", "/apple-touch-icon.png", "apple-touch-icon metadata");
includes("src/app/layout.tsx", "/icon-512.png", "existing JSON-LD/logo-safe icon path");
// Standalone/PWA packaging properties — keep them from silently regressing.
includes("src/app/layout.tsx", "export const viewport", "Next viewport export");
includes("src/app/layout.tsx", 'viewportFit: "cover"', "viewport-fit cover for safe-area env()");
includes("src/app/layout.tsx", "themeColor", "theme-color meta");
includes("src/app/layout.tsx", "appleWebApp", "iOS appleWebApp standalone config");
// black-translucent status bar + viewport-fit cover draws content under the notch;
// the sticky top app bar must reserve env(safe-area-inset-top) or iOS standalone clips it.
includes("src/components/AppHeader.tsx", "pt-[env(safe-area-inset-top)]", "header top safe-area inset");

includes("src/components/PwaInstallHelper.tsx", "beforeinstallprompt", "install prompt listener");
includes("src/components/PwaInstallHelper.tsx", "appinstalled", "appinstalled listener");
includes("src/components/PwaInstallHelper.tsx", "display-mode: standalone", "standalone detection");
includes("src/components/PwaInstallHelper.tsx", "navigator", "iOS standalone fallback");

includes("src/app/offline/page.tsx", "OfflineContent", "offline guidance page component");
includes("src/components/OfflineContent.tsx", "offlineCopy", "offline guidance uses localized copy");
includes("src/lib/i18n.ts", "네트워크가 필요해요", "offline guidance copy");

const sourceFiles = [
  "src/app/layout.tsx",
  "src/components/PwaInstallHelper.tsx",
  "src/app/offline/page.tsx",
  "src/app/manifest.ts",
];
for (const path of sourceFiles) notIncludes(path, "serviceWorker.register", "service worker registration");

// Exercise the assetlinks generator offline so it can't silently regress.
// --dry-run must print parseable JSON and never touch public/.well-known.
{
  const gen = rel("scripts/generate-assetlinks.mjs");
  // A varied (non-repeated-byte) hex value: passes format + the fake-dummy guard
  // so --dry-run can prove the JSON shape without a real signing cert.
  const smokeFingerprint = Array.from({ length: 32 }, (_, i) =>
    i.toString(16).padStart(2, "0").toUpperCase(),
  ).join(":");
  const dry = spawnSync(
    process.execPath,
    [gen, "--package", "com.ornscore.app", "--fingerprint", smokeFingerprint, "--dry-run"],
    { cwd: ROOT, encoding: "utf8" },
  );
  let dryJsonOk = false;
  try {
    const parsed = JSON.parse(dry.stdout);
    dryJsonOk =
      parsed?.[0]?.target?.package_name === "com.ornscore.app" &&
      parsed?.[0]?.target?.sha256_cert_fingerprints?.[0] === smokeFingerprint;
  } catch {
    dryJsonOk = false;
  }
  if (dry.status === 0 && dryJsonOk) pass("assetlinks generator --dry-run emits valid JSON, writes nothing");
  else failure("assetlinks generator --dry-run did not emit valid JSON (exit 0 expected)");

  // Placeholder fingerprint must be rejected (non-zero exit, nothing written).
  const placeholder = spawnSync(
    process.execPath,
    [gen, "--package", "com.ornscore.app", "--fingerprint", "REPLACE_WITH_REAL_SHA256_FINGERPRINT"],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (placeholder.status !== 0) pass("assetlinks generator rejects placeholder fingerprint");
  else failure("assetlinks generator accepted a placeholder fingerprint");

  // A format-valid but obviously-fake dummy (single repeated byte, e.g. AB:AB:...)
  // must also be rejected — this is the value that would silently publish a
  // broken domain-verification file if the guard ever regressed.
  const dummyFingerprint = new Array(32).fill("AB").join(":");
  const dummy = spawnSync(
    process.execPath,
    [gen, "--package", "com.ornscore.app", "--fingerprint", dummyFingerprint],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (dummy.status !== 0) pass("assetlinks generator rejects repeated-byte dummy fingerprint");
  else failure("assetlinks generator accepted a repeated-byte dummy fingerprint");

  // The placeholder package id must be rejected regardless of fingerprint.
  const badPackage = spawnSync(
    process.execPath,
    [gen, "--package", "com.example.ornscore", "--fingerprint", smokeFingerprint],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (badPackage.status !== 0) pass("assetlinks generator rejects placeholder package id");
  else failure("assetlinks generator accepted the placeholder package id");

  // None of the exercises above may create the real file.
  if (existsSync(join(ROOT, "public", ".well-known", "assetlinks.json"))) {
    failure("assetlinks generator wrote public/.well-known/assetlinks.json during dry-run check");
  } else {
    pass("assetlinks generator checks left public/.well-known absent");
  }
}

const example = JSON.parse(read("docs/templates/assetlinks.example.json"));
const exampleTarget = example?.[0]?.target;
if (
  exampleTarget?.namespace === "android_app" &&
  exampleTarget?.package_name === "com.example.ornscore" &&
  exampleTarget?.sha256_cert_fingerprints?.[0] === "REPLACE_WITH_REAL_SHA256_FINGERPRINT"
) {
  pass("assetlinks example is placeholder-only and not served");
} else {
  failure("assetlinks example placeholder changed unexpectedly");
}

includes("docs/app-store-submission-pack.md", "마지막 갱신: 2026-07-01", "current store submission pack date");
includes("docs/app-store-submission-pack.md", "로그인 방식: 이메일 매직링크, Kakao, Google, Naver.", "active auth providers in store pack");
includes("docs/app-store-submission-pack.md", "현재 유료 결제 없음", "no in-app payments in store pack");
includes("docs/app-store-submission-pack.md", "Supabase, Vercel, Resend, Kakao, Google, Naver", "store privacy processors match public policy");
includes("docs/app-packaging-readiness.md", "제품 결정 — Android TWA 우선", "Android TWA first decision locked");
includes("docs/app-packaging-readiness.md", "iOS 정식 래퍼는 보류", "iOS native wrapper deferred");
includes("docs/app-store-submission-pack.md", "1차 스토어 경로는 **Android TWA**", "store pack uses Android TWA first path");
includes("docs/app-store-submission-pack.md", "npm run app:assetlinks -- --package com.ornscore.app", "assetlinks command uses locked package id");
includes("docs/ornscore-owner-final-checklist.md", "첫 스토어 결정**: Android TWA 우선", "owner checklist first store decision complete");
includes("docs/app-roadmap.md", "1차 스토어 패키징은 **Android TWA 우선**", "roadmap decision lock");
includes("docs/app-store-submission-pack.md", "com.ornscore.app", "Android package id documented");
includes("docs/ornscore-android-twa-owner-checklist.md", "com.ornscore.app", "owner intake checklist locks package id");
includes("docs/ornscore-android-twa-owner-checklist.md", "npm run app:assetlinks -- --package", "owner intake checklist keeps assetlinks handoff command");
includes("docs/ornscore-android-assetlinks-owner-kit.md", "keytool -list -v", "assetlinks kit documents keytool fingerprint step");
includes("docs/ornscore-android-assetlinks-owner-kit.md", "npm run app:assetlinks -- --package com.ornscore.app --fingerprint", "assetlinks kit documents generate command");
notIncludes("docs/app-store-submission-pack.md", "Android TWA를 먼저 갈지 결정", "undecided Android TWA wording");
notIncludes("docs/app-packaging-readiness.md", "Android TWA (다음 후보)", "stale Android TWA candidate heading");
notIncludes("docs/app-store-submission-pack.md", "Naver는 준비 중", "stale Naver-disabled wording");
notIncludes("docs/app-store-submission-pack.md", "AI 분석 기록", "stale AI history data item");
notIncludes("docs/app-store-submission-pack.md", "Anthropic", "stale Anthropic processor");

// Single-doc readiness audit: a maintainer opens one doc to see ready / owner-only / not-yet-automatable.
// Keep its core claims from silently regressing (SW still not registered, Android TWA first, iOS deferred).
includes("docs/app-readiness-audit-2026-07-11.md", "app packaging check passed (1 external gate waiting)", "readiness audit records current app:check result");
includes("docs/app-readiness-audit-2026-07-11.md", "Service Worker는 여전히 의도적으로 미등록", "readiness audit confirms SW intentionally unregistered");
includes("docs/app-readiness-audit-2026-07-11.md", "Android TWA로 잠금", "readiness audit locks Android TWA first path");
includes("docs/app-readiness-audit-2026-07-11.md", "iOS 정식 래퍼는 **운영자·Mac·Xcode 게이트**로 보류", "readiness audit keeps iOS wrapper owner-gated");
notIncludes("docs/app-readiness-audit-2026-07-11.md", "Play Store에 등재됨", "false Play Store live claim in readiness audit");

const publicAssetlinks = rel("public/.well-known/assetlinks.json");
if (existsSync(publicAssetlinks)) {
  const deployed = readFileSync(publicAssetlinks, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(deployed);
  } catch {
    parsed = undefined;
  }
  if (parsed === undefined) {
    failure("public assetlinks.json is not valid JSON");
  } else {
    // Structural guard: reject not just the exact placeholder strings but any
    // fake/dummy fingerprint (repeated byte), placeholder package, or wrong
    // shape — a format-valid dummy must never publish as if it were real.
    const { ok, reasons } = validatePublicStatements(parsed);
    if (ok) pass("public assetlinks.json uses real-looking, non-placeholder values");
    else failure(`public assetlinks.json is not publishable: ${reasons.join("; ")}`);
  }
} else {
  waiting("public/.well-known/assetlinks.json not generated yet; needs real Android package + SHA-256 fingerprint");
}

if (fail > 0) {
  console.error(`app packaging check FAILED (${fail} fail, ${wait} wait)`);
  process.exit(1);
}

console.log(`app packaging check passed (${wait} external gate${wait === 1 ? "" : "s"} waiting)`);
