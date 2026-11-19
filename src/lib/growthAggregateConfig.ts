export function growthAggregateConfig() {
  const origin = process.env.ORNSCORE_GROWTH_ORIGIN;
  const databaseUrl = process.env.ORNSCORE_GROWTH_DATABASE_URL;
  if (process.env.ORNSCORE_GROWTH_ENABLED !== "1" || !origin || !databaseUrl) return undefined;
  try {
    const url = new URL(origin);
    if (origin !== url.origin || (url.protocol !== "https:" && origin !== "http://localhost:3000")) return undefined;
    return { origin, databaseUrl };
  } catch {
    return undefined;
  }
}
