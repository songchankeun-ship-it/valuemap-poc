import Link from "next/link";
import { DisclosureExplorer } from "@/components/DisclosureExplorer";

export const metadata = {
  title: "공시 신호 — 밸류맵",
  description: "최근 7일 한국 상장사 공시에서 5가지 시장 신호만 추출. 자기주식·내부자 매수·정정·대형계약·증자.",
};

export default function DisclosuresPage() {
  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-zinc-100">공시 신호</span>
      </nav>

      <header>
        <h1 className="text-xl font-medium mb-1">공시 신호</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          최근 7일 코스피·코스닥 공시에서 자체 추출한 <strong>5가지 시장 신호</strong>.
          자기주식 취득, 임원 매수, 손익 정정, 대형 계약, 유증/CB.
        </p>
      </header>

      <DisclosureExplorer />

      <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">
        본 페이지의 신호는 DART 공시 보고서명 매칭 기반 1차 필터입니다.
        본문 확인 + 시세 추이 검토 후 판단하세요. 투자 권유가 아닙니다.
      </p>
    </div>
  );
}
