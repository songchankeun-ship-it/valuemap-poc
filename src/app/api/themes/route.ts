// /api/themes — DB가 연결돼 있으면 실제 테마 목록, 아니면 더미 데이터 폴백
import { NextResponse } from "next/server";
import { mockTopNeglectedThemes } from "@/lib/mockData";

// Next 15 는 GET Route Handler 를 더 이상 기본 캐시하지 않는다(14 는 기본 프리렌더).
// 이 핸들러는 요청 입력(URL·쿠키·헤더)을 전혀 읽지 않고 빌드 시 상수(mockTopNeglectedThemes)만
// 직렬화하므로, 마이그레이션 전(Next 14) 동작인 "프리렌더된 정적 응답"을 명시적으로 보존한다.
// 이는 전역 강제(blanket force)가 아니라 프리렌더 계약이 실제로 바뀐 유일한 라우트에 대한
// 의도 선언이다(설계서 Slice C). 추후 위 Prisma 경로를 연결하면 그때 캐시 모드를 재검토한다.
export const dynamic = "force-static";

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
