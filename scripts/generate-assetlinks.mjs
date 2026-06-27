// Generate public/.well-known/assetlinks.json for Android TWA/App Links.
//
// Usage:
//   node scripts/generate-assetlinks.mjs --package com.ornscore.app --fingerprint "AA:BB:..."
//   ORNSCORE_ANDROID_PACKAGE=com.ornscore.app ORNSCORE_ANDROID_SHA256="AA:BB:..." node scripts/generate-assetlinks.mjs
//   node scripts/generate-assetlinks.mjs --package com.ornscore.app --fingerprint "AA:BB:..." --dry-run
//
// Do not run this with placeholder values. The fingerprint must be the real
// SHA-256 certificate fingerprint for the signing key used by the published
// Android package.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", ".well-known", "assetlinks.json");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const packageName = arg("--package") ?? process.env.ORNSCORE_ANDROID_PACKAGE;
const fingerprint = (arg("--fingerprint") ?? process.env.ORNSCORE_ANDROID_SHA256 ?? "").toUpperCase();
const dryRun = process.argv.includes("--dry-run");

const packageOk = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName ?? "");
const fingerprintOk = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fingerprint);

if (!packageOk) {
  console.error("FAIL package name must look like com.ornscore.app");
  process.exit(1);
}

if (!fingerprintOk) {
  console.error("FAIL fingerprint must be 32 SHA-256 hex bytes separated by ':'");
  process.exit(1);
}

const statements = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: [fingerprint],
    },
  },
];

const json = JSON.stringify(statements, null, 2) + "\n";

if (dryRun) {
  process.stdout.write(json);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json, "utf8");
  console.log("wrote public/.well-known/assetlinks.json");
}
