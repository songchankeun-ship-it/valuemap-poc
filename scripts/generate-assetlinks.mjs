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
import {
  PACKAGE_RE,
  FINGERPRINT_RE,
  buildStatements,
  isFakeFingerprint,
  isPlaceholderPackage,
  normalizeFingerprint,
} from "./lib/assetlinks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", ".well-known", "assetlinks.json");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const packageName = arg("--package") ?? process.env.ORNSCORE_ANDROID_PACKAGE;
const fingerprint = normalizeFingerprint(arg("--fingerprint") ?? process.env.ORNSCORE_ANDROID_SHA256);
const dryRun = process.argv.includes("--dry-run");

// Reject the well-known placeholders outright with a pointer to the how-to kit,
// so a template value can never be mistaken for a real signing fingerprint.
if (isPlaceholderPackage(packageName)) {
  console.error(
    "FAIL placeholder package com.example.ornscore is a template value. Use the real " +
      "package id (com.ornscore.app).\n" +
      "See docs/ornscore-android-assetlinks-owner-kit.md",
  );
  process.exit(1);
}

if (!PACKAGE_RE.test(packageName ?? "")) {
  console.error("FAIL package name must look like com.ornscore.app");
  process.exit(1);
}

if (!FINGERPRINT_RE.test(fingerprint)) {
  console.error("FAIL fingerprint must be 32 SHA-256 hex bytes separated by ':'");
  process.exit(1);
}

// A format-valid but obviously-fake fingerprint (the template placeholder, or a
// single repeated byte like AB:AB:...:AB) must never be written or blessed —
// even in --dry-run. Publishing it would fail TWA domain verification and expose
// the address bar. The real value comes only from the app-signing key SHA-256.
if (isFakeFingerprint(fingerprint)) {
  console.error(
    "FAIL fingerprint is a placeholder/dummy (repeated byte or template value), not a real " +
      "signing cert. The SHA-256 must come from the Play Console app-signing key or `keytool` " +
      "on the real keystore.\n" +
      "See docs/ornscore-android-assetlinks-owner-kit.md",
  );
  process.exit(1);
}

const statements = buildStatements(packageName, fingerprint);

const json = JSON.stringify(statements, null, 2) + "\n";

if (dryRun) {
  process.stdout.write(json);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json, "utf8");
  console.log("wrote public/.well-known/assetlinks.json");
}
