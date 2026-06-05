// /api/dart?bgnDe=20260520&endDe=20260528
// DART API 프록시 — 클라이언트가 직접 키를 노출하지 않고 사용
import { NextRequest, NextResponse } from "next/server";
import { listDisclosures } from "@/lib/dart";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bgnDe = url.searchParams.get("bgnDe") ?? undefined;
  const endDe = url.searchParams.get("endDe") ?? undefined;
  const corpCode = url.searchParams.get("corpCode") ?? undefined;
  const pageNo = Number(url.searchParams.get("pageNo") ?? 1);

  try {
    const data = await listDisclosures({ bgnDe, endDe, corpCode, pageNo });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "DART 호출 실패" },
      { status: 500 }
    );
  }
}
