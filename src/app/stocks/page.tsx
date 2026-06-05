// /stocks — 검색·필터·정렬 페이지
// 서버 컴포넌트로 전체 풀 전달 → 클라이언트 컴포넌트가 인터랙션 처리
import Link from "next/link";
import { getAllStocks } from "@/lib/mockData";
import { allThemes } from "@/lib/mockStockPool";
import { StocksExplorer } from "@/components/StocksExplorer";

export const metadata = {
  title: "종목 탐색 — 밸류맵",
  description: "자체 지표 4종 기반으로 한국 상장 종목을 16가지 기준으로 정렬·필터링.",
};

export default function StocksPage() {
  const all = getAllStocks();
  const themes = allThemes();

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <span className="text-gray-900">종목 탐색</span>
      </nav>

      <header>
        <h1 className="text-xl font-medium mb-1">종목 탐색</h1>
        <p className="text-sm text-gray-500">
          {all.length}개 종목 · 자체 지표 4종으로 정렬 · 16가지 필터
        </p>
      </header>

      <StocksExplorer initialStocks={all} themes={themes} />
    </div>
  );
}
