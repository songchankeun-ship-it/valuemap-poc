import type { Metadata } from "next";
import { BetaProgramClient } from "@/components/BetaProgramClient";

export const metadata: Metadata = {
  title: "창립 베타 체험 — 오른스코어",
  description: "오른스코어 첫 사용자 20명을 위한 짧은 제품 체험과 피드백 페이지입니다.",
  robots: { index: false, follow: false },
};

export default function BetaPage() {
  return (
    <div className="mx-auto max-w-3xl py-2 md:py-5">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">창립 베타 · 첫 20명</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-950 dark:text-zinc-50">
          10분만 사용하고 막힌 지점을 알려주세요
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          오른스코어는 한국 주식 후보를 검색하고 점수 근거를 확인한 뒤 관심 종목으로 다시 돌아오는 탐색 도구입니다.
          수익률이나 종목 추천을 평가하는 테스트가 아니라, 이 흐름이 실제로 이해되고 쓸 만한지를 확인하는 베타입니다.
        </p>
      </header>

      <div className="pt-6">
        <BetaProgramClient />
      </div>
    </div>
  );
}
