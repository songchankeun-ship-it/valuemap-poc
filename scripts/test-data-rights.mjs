import { evaluateDataRights, loadRepositoryInputs } from "./verify-data-rights.mjs";

const baseline = loadRepositoryInputs();
let failed = 0;

function check(name, condition) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${name}`);
  }
}

function clone(value) {
  return structuredClone(value);
}

check("baseline repository passes", evaluateDataRights(baseline).length === 0);

{
  const fixture = clone(baseline);
  fixture.manifest.globalPolicy.monetization = "allowed";
  check("monetization policy cannot open", evaluateDataRights(fixture).some((e) => e.includes("monetization")));
}
{
  const fixture = clone(baseline);
  fixture.apiRoutes.push("src/app/api/new-data/route.ts");
  check("new API route requires review", evaluateDataRights(fixture).some((e) => e.includes("API route baseline")));
}
{
  const fixture = clone(baseline);
  fixture.files.quoteRoute += '\nfetch("https://polling.finance.naver.com")';
  check("unofficial quote fetch is rejected", evaluateDataRights(fixture).some((e) => e.includes("quote route")));
}
{
  const fixture = clone(baseline);
  fixture.files.watchlistCsv += '\nconst compositeScore = 80;';
  check("provider-derived CSV field is rejected", evaluateDataRights(fixture).some((e) => e.includes("compositeScore")));
}
{
  const fixture = clone(baseline);
  fixture.manifest.datasets.find((dataset) => dataset.id === "daily-price-volume").repositoryPolicy = [];
  check("unverified source cannot expand", evaluateDataRights(fixture).some((e) => e.includes("no-expansion")));
}
{
  const fixture = clone(baseline);
  fixture.manifest.datasets.find((dataset) => dataset.id === "daily-price-volume").rightsStatus = "official-api-conditional";
  check("unverified source cannot self-promote", evaluateDataRights(fixture).some((e) => e.includes("must remain unverified")));
}

if (failed) {
  console.error(`\n${failed} data-rights self-test(s) failed.`);
  process.exit(1);
}
console.log("PASS: data-rights gate rejects monetization, new APIs, unofficial quote polling, provider-derived CSV fields, unreviewed expansion, and self-promoted rights status");
