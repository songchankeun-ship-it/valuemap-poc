// scripts/check-icons.mjs
//
// Validate the generated PWA icon PNGs with the Node standard library only:
//  - assert the 8-byte PNG signature (89 50 4E 47 0D 0A 1A 0A)
//  - parse IHDR width/height (big-endian uint32 at byte offsets 16 and 20)
//  - assert exact expected pixel dimensions
// Exits non-zero (and prints FAIL) on any mismatch so a wrong-size / 404
// asset can never be wired into the manifest unnoticed.
//
// Run: node scripts/check-icons.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const expected = [
  { file: "icon-192.png", w: 192, h: 192 },
  { file: "icon-512.png", w: 512, h: 512 },
  { file: "icon-512-maskable.png", w: 512, h: 512 },
  { file: "apple-touch-icon.png", w: 180, h: 180 },
];

let ok = true;
for (const e of expected) {
  const path = join(PUBLIC, e.file);
  try {
    const buf = readFileSync(path);
    const sigOk = buf.subarray(0, 8).equals(SIG);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const dimOk = w === e.w && h === e.h;
    if (sigOk && dimOk) {
      console.log(`OK   ${e.file}  ${w}x${h}  (sig ok)`);
    } else {
      ok = false;
      console.log(`FAIL ${e.file}  sig=${sigOk} dims=${w}x${h} expected=${e.w}x${e.h}`);
    }
  } catch (err) {
    ok = false;
    console.log(`FAIL ${e.file}  ${err.message}`);
  }
}

if (!ok) {
  console.error("icon validation FAILED");
  process.exit(1);
}
console.log("all icons valid");
