// scripts/generate-icons.mjs
//
// Purpose: Generate the OrnScore PWA / home-screen icon PNGs from the brand
// mark defined in src/app/icon.svg, using ONLY the Node standard library
// (node:fs + node:zlib). No external npm deps, no SVG rasterizer — the icon
// geometry is drawn directly into an RGBA pixel buffer (4x supersampled for
// anti-aliasing) and encoded as a valid PNG (signature + IHDR + IDAT + IEND,
// each chunk CRC32'd).
//
// Brand source (32-unit grid, matches src/app/icon.svg):
//   background  rounded rect rx=7, fill #2563eb
//   ring        circle  cx=15 cy=17 r=7.5  stroke #ffffff width 2.6  (no fill)
//   diagonal    line    M9 21 L23 9        stroke #ffffff width 2.6  round cap
//
// Outputs (exact pixel dimensions):
//   public/icon-192.png           192x192  "any"      rounded-corner brand bg
//   public/icon-512.png           512x512  "any"      rounded-corner brand bg
//   public/icon-512-maskable.png  512x512  "maskable" full-bleed bg, mark in
//                                          inner ~80% safe zone (10% padding)
//   public/apple-touch-icon.png   180x180  iOS        opaque full-bleed square
//                                          (iOS applies its own corner mask)
//
// Re-run:  node scripts/generate-icons.mjs
// Validate dimensions afterwards: node scripts/check-icons.mjs

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

// --- brand constants (icon.svg) ---
const BRAND = { r: 0x25, g: 0x63, b: 0xeb }; // #2563eb
const WHITE = { r: 0xff, g: 0xff, b: 0xff };
const GRID = 32;
const RX = 7; // rounded-rect corner radius on the 32-grid
const RING = { cx: 15, cy: 17, r: 7.5, w: 2.6 };
const LINE = { ax: 9, ay: 21, bx: 23, by: 9, w: 2.6 };

const SS = 4; // supersampling factor (SS*SS sub-samples per output pixel)

// --- small geometry helpers (operate in 32-unit icon space) ---
function inRoundedRect(x, y, w, h, r) {
  const rx = Math.min(Math.max(x, r), w - r);
  const ry = Math.min(Math.max(y, r), h - r);
  const dx = x - rx;
  const dy = y - ry;
  return dx * dx + dy * dy <= r * r;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.min(1, Math.max(0, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Evaluate the icon mark at a point in 32-unit icon space.
// Returns "white" | "bg" | null (transparent).
function sampleMark(ix, iy, opaqueSquareBg) {
  // white mark (ring stroke or diagonal stroke) takes precedence
  const ringD = Math.abs(Math.hypot(ix - RING.cx, iy - RING.cy) - RING.r);
  if (ringD <= RING.w / 2) return "white";
  if (distToSegment(ix, iy, LINE.ax, LINE.ay, LINE.bx, LINE.by) <= LINE.w / 2)
    return "white";
  if (opaqueSquareBg) return "bg"; // maskable / apple: full-bleed square
  if (inRoundedRect(ix, iy, GRID, GRID, RX)) return "bg"; // "any": rounded
  return null;
}

// Render one icon. `safeZone` shrinks the mark into the inner (1-2*pad) box
// (used for the maskable icon). `opaqueSquareBg` fills the whole square with
// the brand color (maskable + apple); otherwise the rounded-rect is used.
function renderIcon(size, { safeZone = 0, opaqueSquareBg = false } = {}) {
  const buf = Buffer.alloc(size * size * 4); // RGBA
  const inset = safeZone * size; // padding in device px on each side
  const markSpan = size - inset * 2; // device px the 32-grid maps onto
  const step = 1 / SS;
  const half = step / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + sx * step + half;
          const py = y + sy * step + half;
          // device px -> 32-unit icon space (account for safe-zone inset)
          const ix = ((px - inset) / markSpan) * GRID;
          const iy = ((py - inset) / markSpan) * GRID;

          let col = null;
          if (opaqueSquareBg) {
            // full square background always present; mark drawn on top
            col = sampleMark(ix, iy, true);
            if (col === null) col = "bg";
          } else {
            col = sampleMark(ix, iy, false);
          }

          if (col === "white") {
            rSum += WHITE.r;
            gSum += WHITE.g;
            bSum += WHITE.b;
            aSum += 255;
          } else if (col === "bg") {
            rSum += BRAND.r;
            gSum += BRAND.g;
            bSum += BRAND.b;
            aSum += 255;
          }
          // null -> fully transparent, contributes nothing
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      buf[o] = Math.round(rSum / n);
      buf[o + 1] = Math.round(gSum / n);
      buf[o + 2] = Math.round(bSum / n);
      buf[o + 3] = Math.round(aSum / n);
    }
  }
  return buf;
}

// --- PNG encoder (stdlib only) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(rgba, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // raw scanlines, filter byte 0 (None) per row
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- generate the four assets ---
const targets = [
  { file: "icon-192.png", size: 192, opts: {} },
  { file: "icon-512.png", size: 512, opts: {} },
  { file: "icon-512-maskable.png", size: 512, opts: { safeZone: 0.1, opaqueSquareBg: true } },
  { file: "apple-touch-icon.png", size: 180, opts: { opaqueSquareBg: true } },
];

for (const t of targets) {
  const rgba = renderIcon(t.size, t.opts);
  const png = encodePng(rgba, t.size);
  const out = join(PUBLIC, t.file);
  writeFileSync(out, png);
  console.log(`wrote public/${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
