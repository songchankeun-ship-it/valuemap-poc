import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { extractBuildMarker } from "./verify-route-canary.mjs";

const ORIGIN = "https://ornscore.com";
const SIZE = 138;
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const shaPattern = /^[0-9a-f]{40}$/;

export async function persistWhenPublished({
  sha, snapshot, secret, request = fetch, pause = (ms) => sleep(ms), attempts = 24,
}) {
  if (!secret) throw new Error("SCORE_PERSIST_SECRET is not configured");
  if (!shaPattern.test(sha)) throw new Error("A full verified publication SHA is required");
  const { asOfBusinessDate: day, metricsVersion, count, stocks } = JSON.parse(snapshot.toString("utf8"));
  if (typeof day !== "string" || !/^\d{8}$/.test(day) || metricsVersion !== "2.4" ||
      count !== SIZE || !Array.isArray(stocks) || stocks.length !== SIZE) throw new Error("Invalid publication snapshot");
  const businessDate = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
  const parsedDay = new Date(businessDate);
  if (!Number.isFinite(parsedDay.getTime()) || parsedDay.toISOString().slice(0, 10) !== businessDate) {
    throw new Error("Invalid publication business date");
  }
  const dataSha256 = digest(snapshot);

  let publicMatch = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const query = `?score-publication=${sha}-${attempt}`;
      const options = { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000) };
      const [page, data] = await Promise.all([
        request(ORIGIN + "/status" + query, options),
        request(ORIGIN + "/data/stocks.json" + query, options),
      ]);
      const [html, bytes] = await Promise.all([page.text(), data.arrayBuffer()]);
      publicMatch = page.ok && data.ok && extractBuildMarker(html) === sha.slice(0, 7) &&
        digest(Buffer.from(bytes)) === dataSha256;
    } catch {
      // Deployment may still be in progress. No write until both reads match.
    }
    if (publicMatch) break;
    if (attempt + 1 < attempts) await pause(15_000);
  }
  if (!publicMatch) throw new Error("Production did not serve the expected deployment and snapshot; no scores written");

  const res = await request(ORIGIN + "/api/cron/save-scores", {
    method: "POST",
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(35000),
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ sha, businessDate, dataSha256 }),
  });
  const receipt = await res.json().catch(() => null);
  if (!res.ok || receipt?.success !== true || receipt.sha !== sha || receipt.businessDate !== businessDate ||
      receipt.verified !== SIZE || receipt.total !== SIZE) {
    const message = Number.isInteger(receipt?.verified) ? `, verified ${receipt.verified}/${SIZE}` : "";
    throw new Error(`Published score storage not confirmed (HTTP ${res.status}${message})`);
  }
  return { sha, businessDate, verified: SIZE };
}

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const sha = process.env.PUBLISHED_SCORE_SHA ?? "";
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  if (head !== sha) throw new Error("The checkout does not match the published SHA");
  const receipt = await persistWhenPublished({
    sha,
    snapshot: readFileSync(resolve(root, "public/data/stocks.json")),
    secret: process.env.SCORE_PERSIST_SECRET,
  });
  console.log(`Verified ${receipt.verified} scores for ${receipt.businessDate} from ${receipt.sha}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Published score storage failed");
    process.exitCode = 1;
  });
}
