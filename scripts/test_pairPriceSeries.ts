import { deepEqual, equal } from "node:assert/strict";
import { alignPairPrices } from "../src/lib/pairPriceSeries";

const p = (d: string, c: number) => ({ d, c, v: 0 });
const a = [p("2026-11-24", 150), p("2026-11-20", 100), p("2026-11-23", 120)];
const b = [p("2026-11-19", 30), p("2026-11-20", 50), p("2026-11-23", 40), p("2026-11-24", 60)];

deepEqual(alignPairPrices(a, b, "20261123"), [
  { date: "2026-11-20", a: 100, b: 100 },
  { date: "2026-11-23", a: 120, b: 80 },
]);
equal(alignPairPrices([p("2026-11-20", NaN), p("2026-11-23", 0)], b), null);
equal(alignPairPrices(a, [p("2026-11-23", 40), p("2026-11-22", -1)]), null);

const month = Array.from({ length: 24 }, (_, i) => p(`2026-11-${String(i + 1).padStart(2, "0")}`, 50 + i));
const tail = alignPairPrices(month, month, "2026-11-23");
equal(tail?.length, 20);
deepEqual(tail?.[0], { date: "2026-11-04", a: 100, b: 100 });
equal(tail?.at(-1)?.date, "2026-11-23");

console.log("PASS: common dates, independently normalized prices, cutoff, data gaps and 20-session limit");
