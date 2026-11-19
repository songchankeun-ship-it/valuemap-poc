import { growthAggregateConfig } from "@/lib/growthAggregateConfig";
import { handleGrowthAggregate } from "@/lib/growthAggregateHandler";
import { growthAggregateStore } from "@/lib/growthAggregateStore";

export async function POST(request: Request) {
  const config = growthAggregateConfig();
  return handleGrowthAggregate(request, config?.origin, config
    ? (key) => growthAggregateStore(config.databaseUrl).increment(key)
    : undefined);
}
