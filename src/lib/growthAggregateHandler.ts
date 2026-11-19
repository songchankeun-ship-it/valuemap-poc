import { growthKey, MAX_GROWTH_BYTES, parseGrowthEvent, type GrowthKey } from "./growthAggregate";

async function readGrowthEvent(request: Request) {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_GROWTH_BYTES)) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;

  const bytes = new Uint8Array(MAX_GROWTH_BYTES);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.length > bytes.length) {
        void reader.cancel().catch(() => {});
        return null;
      }
      bytes.set(value, length);
      length += value.length;
    }
    const body = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
    const raw: unknown = JSON.parse(body);
    // The bridge sends compact JSON. Reject duplicate keys and ignored input.
    return JSON.stringify(raw) === body ? parseGrowthEvent(raw) : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function handleGrowthAggregate(
  request: Request,
  origin: string | undefined,
  increment: ((key: GrowthKey) => Promise<void>) | undefined,
  now = new Date(),
): Promise<Response> {
  const respond = (status: number) => new Response(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
  if (!origin || !increment) return respond(503);
  if (request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") !== "same-origin") return respond(403);
  if (request.headers.get("content-type") !== "application/json" ||
      request.headers.has("content-encoding") || new URL(request.url).search) return respond(400);
  const event = await readGrowthEvent(request);
  if (!event) return respond(400);
  try {
    await increment(growthKey(event, now));
    return respond(204);
  } catch {
    return respond(503);
  }
}
