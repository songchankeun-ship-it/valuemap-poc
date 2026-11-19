import { PrismaClient } from "@prisma/client";
import type { GrowthAggregateStore } from "./growthAggregateReport";

const globalForGrowth = globalThis as typeof globalThis & { ornscoreGrowthDb?: PrismaClient };

export function growthAggregateStore(databaseUrl: string): GrowthAggregateStore {
  const database = () => globalForGrowth.ornscoreGrowthDb ??= new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  return {
    async increment({ day, event, campaign, routeKind }) {
      await database().$queryRaw`SELECT growth_aggregate.increment(${day}::date, ${event}, ${campaign}, ${routeKind}) AS accepted`;
    },
    async read(from, through) {
      return database().$queryRaw`SELECT day, event, campaign, "routeKind", count FROM growth_aggregate.read_days(${from}::date, ${through}::date)`;
    },
  };
}
