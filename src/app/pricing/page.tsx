import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FREE_COMPARE_LIMIT, FREE_WATCHLIST_LIMIT } from "@/lib/limits";

export const metadata = {
  title: "요금제 — 오른스코어",
  description: "오른스코어 무료/Pro 요금제. 종목 탐색·기본 지표는 무료, 알림·조건 저장·백테스트는 Pro(출시 예정).",
};

const FREE = [
  "오늘의 후보 종목 · 오늘의 브리핑",
  "138개 종목 탐색 + 질문형 프리셋",
  "종목 상세(등급·차트·초보자 해석·공시)",
  `관심 종목 ${FREE_WATCHLIST_LIMIT}개 · 비교 ${FREE_COMPARE_LIMIT}개`,
  "AI 분석 월 3회",
  "관심 종목 공시 알림 (이메일)",
];

const PRO = [
  "관심 종목 무제한 + 점수 급변·고급 알림",
  "조건 저장 + 저장 조건 결과 알림",
  "장기 점수 기록 · 업종 대비 비교",
  "백테스트 상세 리포트 · CSV 내보내기",
  "나만의 데일리 브리핑 메일",
  "무료보다 많은 AI 분석 (구체 이용량은 출시 시 공개)",
];

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header className="text-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">← 홈으로</Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">요금제</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-xl mx-auto">
          탐색·기본 분석은 계속 <strong>무료</strong>입니다. 유료(Pro)는 <strong>시간 절약과 변화 알림</strong>에 집중한 도구로 준비 중이에요.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-3">
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">무료</h2>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">₩0</span>
          </div>
          <ul className="space-y-2">
            {FREE.map((f) => (
              <li key={f} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 shrink-0">✓</span><span>{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/today" className="mt-4 block text-center px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
            지금 무료로 시작하기 →
          </Link>
        </section>

        <section className="bg-white dark:bg-zinc-900 border-2 border-blue-300 dark:border-blue-800 rounded-xl p-5 relative">
          <span className="absolute -top-2.5 left-5 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-600 text-white">출시 예정</span>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Pro</h2>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">곧 공개</span>
          </div>
          <ul className="space-y-2">
            {PRO.map((f) => (
              <li key={f} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                <span className="text-blue-600 dark:text-blue-400 shrink-0">★</span><span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">출시되면 가장 먼저 알려드릴게요. (얼리버드 혜택 예정)</p>
            <WaitlistForm source="pricing" />
          </div>
        </section>
      </div>

      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        오른스코어는 <strong>투자 추천 서비스가 아니라 데이터 기반 탐색 도구</strong>입니다. 유료 기능도 개별 종목 매수·매도 조언이 아니라
        "정보·변화 알림"을 제공합니다. 모든 투자 판단과 책임은 본인에게 있습니다.
      </section>
    </div>
  );
}
