import Link from "next/link";
import { requireAdminAccess } from "@/lib/adminAccess";
import { currentGrowthPacket } from "@/lib/currentGrowthPacket";
import { growthAggregateConfig } from "@/lib/growthAggregateConfig";
import { readGrowthPacketEvidence } from "@/lib/growthAggregateReport";
import { growthAggregateStore } from "@/lib/growthAggregateStore";
import { GrowthPacketView } from "./GrowthPacketView";

export const metadata = {
  title: "성장 콘텐츠 운영 — 오른스코어",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminGrowthPacketPage() {
  const admin = await requireAdminAccess("/admin/growth-packet");
  if (!admin.allowed) {
    return <main className="mx-auto max-w-2xl p-5"><h1>접근 권한이 없습니다</h1></main>;
  }

  const config = growthAggregateConfig();
  const evidence = await readGrowthPacketEvidence(config ? growthAggregateStore(config.databaseUrl) : undefined);
  return (
    <main className="mx-auto max-w-5xl px-3 py-5 md:px-4 md:py-8">
      <Link href="/admin" className="text-sm underline">운영 홈</Link>
      <GrowthPacketView packet={currentGrowthPacket()} evidence={evidence} />
    </main>
  );
}
