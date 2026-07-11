// Shared Android Digital Asset Links validation.
//
// Both the generator (scripts/generate-assetlinks.mjs) and the packaging gate
// (scripts/check-app-packaging.mjs) import from here, so the rules for "what is
// a placeholder / obviously-fake value" can never drift between the tool that
// writes public/.well-known/assetlinks.json and the check that guards it.
//
// The guard can only catch OBVIOUS fakes (template placeholders, single-byte
// dummies). It cannot cryptographically prove a fingerprint is the real signing
// cert — that is inherent, and is why publishing still needs owner-provided
// values. See docs/ornscore-android-assetlinks-owner-kit.md.

export const REAL_PACKAGE = "com.ornscore.app";
export const PLACEHOLDER_PACKAGE = "com.example.ornscore";
export const PLACEHOLDER_FINGERPRINT = "REPLACE_WITH_REAL_SHA256_FINGERPRINT";

// Android package id: dot-separated lowercase segments (com.ornscore.app).
export const PACKAGE_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
// SHA-256 cert fingerprint: 32 uppercase hex bytes separated by ':'.
export const FINGERPRINT_RE = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

// Accept the value an owner is likely to paste (Play Console / keytool output):
// strip a leading "SHA256:"/"SHA-256:" label and any whitespace, then uppercase.
export function normalizeFingerprint(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/^SHA-?256:/i, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function isPlaceholderPackage(pkg) {
  return pkg === PLACEHOLDER_PACKAGE;
}

// True when the fingerprint is a template placeholder, malformed, or an
// obviously-fake dummy where all 32 bytes are identical (AB:AB:...:AB /
// 00:00:... / FF:FF:...). A real signing cert is never a single repeated byte;
// the all-"AB" value is exactly what check-app-packaging.mjs feeds the generator
// as a throwaway. This enforces the rule documented in the owner kit so a
// format-valid dummy can never be mistaken for a real fingerprint.
export function isFakeFingerprint(fp) {
  const value = String(fp ?? "").toUpperCase();
  if (!value || value === PLACEHOLDER_FINGERPRINT) return true;
  if (!FINGERPRINT_RE.test(value)) return true; // malformed can't be a real cert
  const bytes = value.split(":");
  if (bytes.every((b) => b === bytes[0])) return true; // single repeated byte
  return false;
}

export function buildStatements(packageName, fingerprint) {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ];
}

// Validate a parsed assetlinks document that is (or would be) served publicly.
// Returns { ok, reasons: string[] } — reasons is empty only when the document is
// safe to publish (real-looking package + non-fake fingerprint, correct shape).
export function validatePublicStatements(statements) {
  const reasons = [];
  if (!Array.isArray(statements) || statements.length === 0) {
    return { ok: false, reasons: ["assetlinks is not a non-empty array"] };
  }
  for (const statement of statements) {
    const relation = statement?.relation;
    if (
      !Array.isArray(relation) ||
      !relation.includes("delegate_permission/common.handle_all_urls")
    ) {
      reasons.push("missing delegate_permission/common.handle_all_urls relation");
    }
    const target = statement?.target;
    if (target?.namespace !== "android_app") {
      reasons.push(`target namespace is not android_app (${target?.namespace})`);
    }
    const pkg = target?.package_name;
    if (isPlaceholderPackage(pkg)) {
      reasons.push(`placeholder package name ${pkg}`);
    } else if (!PACKAGE_RE.test(pkg ?? "")) {
      reasons.push(`package name is malformed (${pkg})`);
    }
    const fingerprints = target?.sha256_cert_fingerprints;
    if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
      reasons.push("no sha256_cert_fingerprints");
    } else {
      for (const fingerprint of fingerprints) {
        if (isFakeFingerprint(fingerprint)) {
          reasons.push(`placeholder/dummy fingerprint ${fingerprint}`);
        }
      }
    }
  }
  return { ok: reasons.length === 0, reasons };
}
