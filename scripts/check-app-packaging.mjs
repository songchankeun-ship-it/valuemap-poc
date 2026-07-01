// App packaging readiness gate for OrnScore.
//
// This validates the local PWA/TWA preparation files without requiring store
// accounts, Android signing fingerprints, or a running server.

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

includes("src/components/PwaInstallHelper.tsx", "beforeinstallprompt", "install prompt listener");
includes("src/components/PwaInstallHelper.tsx", "appinstalled", "appinstalled listener");
includes("src/components/PwaInstallHelper.tsx", "display-mode: standalone", "standalone detection");
includes("src/components/PwaInstallHelper.tsx", "navigator", "iOS standalone fallback");

includes("src/app/offline/page.tsx", "네트워크가 필요해요", "offline guidance page");

const sourceFiles = [
  "src/app/layout.tsx",
  "src/components/PwaInstallHelper.tsx",
  "src/app/offline/page.tsx",
  "src/app/manifest.ts",
];
for (const path of sourceFiles) notIncludes(path, "serviceWorker.register", "service worker registration");

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
includes("docs/app-store-submission-pack.md", "com.ornscore.app", "Android package id candidate documented");
notIncludes("docs/app-store-submission-pack.md", "Naver는 준비 중", "stale Naver-disabled wording");
notIncludes("docs/app-store-submission-pack.md", "AI 분석 기록", "stale AI history data item");
notIncludes("docs/app-store-submission-pack.md", "Anthropic", "stale Anthropic processor");

const publicAssetlinks = rel("public/.well-known/assetlinks.json");
if (existsSync(publicAssetlinks)) {
  const deployed = readFileSync(publicAssetlinks, "utf8");
  if (deployed.includes("REPLACE_WITH_REAL") || deployed.includes("com.example.ornscore")) {
    failure("public assetlinks.json contains placeholder values");
  } else {
    JSON.parse(deployed);
    pass("public assetlinks.json uses non-placeholder values");
  }
} else {
  waiting("public/.well-known/assetlinks.json not generated yet; needs real Android package + SHA-256 fingerprint");
}

if (fail > 0) {
  console.error(`app packaging check FAILED (${fail} fail, ${wait} wait)`);
  process.exit(1);
}

console.log(`app packaging check passed (${wait} external gate${wait === 1 ? "" : "s"} waiting)`);
