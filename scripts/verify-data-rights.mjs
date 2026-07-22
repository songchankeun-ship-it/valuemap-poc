import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(SCRIPTS_DIR, "..");

const REQUIRED_BLOCKS = [
  "monetization",
  "providerDerivedBulkDownload",
  "newPublicDataApi",
  "redistributionExpansion",
  "newFieldsFromUnclearedSources",
];
const REQUIRED_UNVERIFIED_BLOCKS = [
  "monetization",
  "provider-derived-bulk-download",
  "new-public-data-api",
  "redistribution-expansion",
  "new-fields",
];
const REQUIRED_DATASETS = [
  "daily-price-volume",
  "naver-financial-html",
  "yahoo-yfinance-fields",
  "open-dart-disclosures",
];
const USER_DATA_DOWNLOAD_ALLOWLIST = ["src/components/WatchlistClient.tsx"];

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, predicate, out);
    else if (predicate(absolute)) out.push(absolute);
  }
  return out;
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function loadRepositoryInputs(root = ROOT) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const apiRoutes = sorted(
    walk(join(root, "src", "app", "api"), (path) => path.endsWith("route.ts")).map((path) =>
      relative(root, path).replaceAll("\\", "/"),
    ),
  );
  const sourceFiles = walk(join(root, "src"), (path) => /\.(ts|tsx)$/.test(path));
  const downloadSurfaces = sorted(
    sourceFiles
      .filter((path) => /createObjectURL|Content-Disposition|\bdownload\s*=/.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path).replaceAll("\\", "/")),
  );
  return {
    manifest: JSON.parse(read("config/data-rights-manifest.json")),
    apiRoutes,
    downloadSurfaces,
    files: {
      quoteRoute: read("src/app/api/quote/[ticker]/route.ts"),
      livePrice: read("src/components/LivePrice.tsx"),
      watchlistCsv: read("src/lib/watchlistCsv.ts"),
      pricing: read("src/lib/pricing.ts"),
      allPublicSourceCopy: sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n"),
    },
  };
}

export function evaluateDataRights({ manifest, apiRoutes, downloadSurfaces, files }) {
  const errors = [];
  const fail = (message) => errors.push(message);

  if (manifest?.schemaVersion !== 1) fail("manifest schemaVersion must be 1");
  if (manifest?.legalStatus !== "technical-containment-not-legal-clearance") {
    fail("manifest must retain the no-legal-clearance status");
  }
  for (const key of REQUIRED_BLOCKS) {
    if (manifest?.globalPolicy?.[key] !== "blocked") fail(`globalPolicy.${key} must be blocked`);
  }

  const datasets = Array.isArray(manifest?.datasets) ? manifest.datasets : [];
  const byId = new Map(datasets.map((dataset) => [dataset?.id, dataset]));
  if (byId.size !== datasets.length) fail("dataset ids must be unique");
  for (const id of REQUIRED_DATASETS) {
    if (!byId.has(id)) fail(`required dataset missing: ${id}`);
  }
  for (const id of ["daily-price-volume", "naver-financial-html", "yahoo-yfinance-fields"]) {
    if (byId.get(id)?.rightsStatus !== "unverified") fail(`${id}: must remain unverified until written clearance is recorded`);
  }
  if (byId.get("open-dart-disclosures")?.rightsStatus !== "official-api-conditional") {
    fail("open-dart-disclosures: must remain official-api-conditional");
  }
  for (const dataset of datasets) {
    if (!dataset || typeof dataset !== "object") {
      fail("every dataset must be an object");
      continue;
    }
    if (dataset.rightsStatus === "unverified") {
      if (!dataset.repositoryPolicy?.includes("no-expansion")) {
        fail(`${dataset.id}: unverified source must be no-expansion`);
      }
      for (const operation of REQUIRED_UNVERIFIED_BLOCKS) {
        if (!dataset.blockedOperations?.includes(operation)) {
          fail(`${dataset.id}: missing blocked operation ${operation}`);
        }
      }
    } else if (dataset.rightsStatus !== "official-api-conditional") {
      fail(`${dataset.id}: unsupported rightsStatus ${dataset.rightsStatus}`);
    }
  }

  const expectedRoutes = sorted(manifest?.existingApiRouteBaseline ?? []);
  if (JSON.stringify(expectedRoutes) !== JSON.stringify(sorted(apiRoutes))) {
    fail("API route baseline changed; review data rights before adding or removing an API route");
  }

  if (/polling\.finance\.naver\.com|finance\.naver\.com|User-Agent|Referer/.test(files.quoteRoute)) {
    fail("quote route must not call or impersonate an unofficial Naver endpoint");
  }
  if (/\bfetch\s*\(/.test(files.quoteRoute)) fail("quote route must not perform an external fetch");
  for (const marker of ["realStockPool", "dataMetadata.asOfBusinessDate", 'source: "published-close"']) {
    if (!files.quoteRoute.includes(marker)) fail(`quote route missing published-close marker: ${marker}`);
  }
  if (/\/api\/quote|setInterval|useEffect|useState/.test(files.livePrice)) {
    fail("stock price UI must render the published close without polling a quote API");
  }
  if (!files.livePrice.includes("공개 데이터 종가")) fail("stock price UI must label the published close");

  if (!files.watchlistCsv.includes('const CSV_HEADERS = ["ticker", "group", "note", "addedAt"]')) {
    fail("watchlist CSV headers must remain limited to ticker and user-authored metadata");
  }
  for (const forbidden of ["compositeScore", '"name"', "currentPrice", "changePct", '"per"', '"pbr"', '"roe"', "dividendYield"]) {
    if (files.watchlistCsv.includes(forbidden)) {
      fail(`watchlist CSV must contain user-owned fields only; found ${forbidden}`);
    }
  }
  if (JSON.stringify(sorted(downloadSurfaces)) !== JSON.stringify(USER_DATA_DOWNLOAD_ALLOWLIST)) {
    fail("download surface changed; provider-derived downloads remain blocked pending rights review");
  }

  if (!files.pricing.includes('id: "pro"') || !files.pricing.includes('id: "premium"')) {
    fail("pricing plan baseline is missing");
  }
  const plannedCount = (files.pricing.match(/status: "planned"/g) ?? []).length;
  if (plannedCount < 2 || /stripe|payment_intent|checkout\.sessions|lemonsqueezy|paddle/i.test(files.allPublicSourceCopy)) {
    fail("paid plans must remain planned with no payment integration");
  }

  for (const stale of [
    "KRX 일별 종가 (FinanceDataReader)",
    "KRX daily close (FinanceDataReader)",
    "현재가 (네이버 지연 시세)",
    "Current price (Naver delayed quote)",
  ]) {
    if (files.allPublicSourceCopy.includes(stale)) fail(`stale public source claim remains: ${stale}`);
  }
  for (const required of ["Naver Finance 전달", "Delivered via Naver Finance", "권리 검토 중"]) {
    if (!files.allPublicSourceCopy.includes(required)) fail(`accurate public source marker missing: ${required}`);
  }

  return errors;
}

function main() {
  const inputs = loadRepositoryInputs();
  const errors = evaluateDataRights(inputs);
  if (errors.length) {
    for (const error of errors) console.error(`FAIL: ${error}`);
    console.error(`\nData-rights gate failed with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log(
    `PASS: data-rights containment (${inputs.manifest.datasets.length} datasets, ${inputs.apiRoutes.length} API routes, user-owned watchlist CSV only, unofficial quote polling removed)`,
  );
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
