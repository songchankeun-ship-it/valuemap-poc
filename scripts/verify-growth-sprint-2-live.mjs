import process from "node:process";

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
const base = baseIndex >= 0 ? args[baseIndex + 1] : null;

if (!base) {
  console.error("Usage: node scripts/verify-growth-sprint-2-live.mjs --base http://127.0.0.1:<port>");
  process.exit(2);
}

const routes = [
  "/stock/005930/opengraph-image",
  "/compare/005930-vs-000660/opengraph-image",
  "/topics/low-per-stocks/opengraph-image",
];

function readPngDimensions(bytes) {
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || !pngSignature.every((byte, index) => bytes[index] === byte)) {
    throw new Error("response is not a PNG");
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

let failures = 0;

for (const route of routes) {
  try {
    const response = await fetch(new URL(route, base), {
      headers: { "cache-control": "no-cache" },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const bytes = Buffer.from(await response.arrayBuffer());

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!contentType.toLowerCase().startsWith("image/png")) {
      throw new Error(`unexpected content-type ${contentType || "(missing)"}`);
    }
    if (bytes.length < 10_000) throw new Error(`image is unexpectedly small (${bytes.length} bytes)`);

    const { width, height } = readPngDimensions(bytes);
    if (width !== 1200 || height !== 630) {
      throw new Error(`unexpected dimensions ${width}x${height}`);
    }

    console.log(`PASS ${route} ${width}x${height} ${bytes.length} bytes`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${route}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  console.error(`FAIL growth sprint 2 live OG gate: ${failures}/${routes.length} routes failed`);
  process.exit(1);
}

console.log(`PASS growth sprint 2 live OG gate: ${routes.length}/${routes.length} routes healthy`);
