// /api/themes — DB가 연결돼 있으면 실제 테마 목록, 아니면 더미 데이터 폴백
import { NextResponse } from "next/server";
import { mockTopNeglectedThemes } from "@/lib/mockData";

export async function GET() {
  try {
    // DB 연결 가능 시 Prisma로 교체:
    // const { db } = await import("@/lib/db");
    // const themes = await db.theme.findMany({
    //   where: { isActive: true },
    //   orderBy: { seoPriority: "desc" },
    //   take: 50,
    // });
    return NextResponse.json({ items: mockTopNeglectedThemes, source: "mock" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
