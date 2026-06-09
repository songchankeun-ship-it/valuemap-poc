import Link from "next/link";
import { dataMetadata } from "@/lib/realStocks";
import { Search, BarChart3, Megaphone } from "lucide-react";

export const metadata = {
  title: "밸류맵 — 한국 테마주 분석 도구",
  description: "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
};

export default function HomePage() {
  return (
    <div className="space-y-5 md:space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-zinc-200 dark:border-zinc-800 p-5 md:p-10">
        <span className="inline-block text-[10px] font-semibold tracking-widest text-blue-700 dark:text-blue-400 uppercase mb-3 px-2 py-0.5 rounded bg-white/60 dark:bg-zinc-900/60">
          한국 테마주 분석 도구 · 베타
        </span>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug">
          오늘 먼저 확인할 종목을,<br/>
          <span className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">데이터로 좁혀</span>보세요.
        </h1>
        <p className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 mt-4 max-w-xl leading-relaxed">
          가격 흐름 · 거래량 · 밸류에이션 · 변동성을 함께 분석해서<br className="hidden md:inline"/>
          먼저 확인할 종목 <strong>후보</strong>를 정리해드립니다.
        </p>
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          ⚠ 투자 추천이 아닌, 종목 탐색 시간을 줄이는 데이터 도구입니다.
        </p>
        <div className="flex gap-2 mt-5 flex-wrap">
          <Link href="/today" className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm">
            오늘의 후보 종목 보기 →
          </Link>
          <Link href="/guide/metrics" className="px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition">
            지표 설명 보기
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/stocks" className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-700 transition">
          <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">종목 탐색</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">{dataMetadata.count}개 종목을 자체 지표 4종으로 정렬·필터링</div>
        </Link>
        <Link href="/compare" className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-700 transition">
          <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">종목 비교</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">관심 종목 4개까지 PER·PBR·ROE 나란히</div>
        </Link>
        <Link href="/disclosures" className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-700 transition">
          <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
            <Megaphone className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">공시 신호</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">DART 5종 신호 자동 분류 (자기주식·임원매수·정정·계약·증자)</div>
        </Link>
      </section>

      <section className="bg-zinc-900 dark:bg-zinc-100 rounded-xl p-4 md:p-5 flex items-center justify-between text-white dark:text-zinc-900 gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-blue-300 dark:text-blue-700 mb-1 uppercase tracking-wider">Coming Soon</div>
          <div className="text-base font-semibold">5년치 실데이터로 전략 검증</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">백테스트 엔진 — 가짜 숫자 없이 정직하게</div>
        </div>
        <Link href="/backtest" className="px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0">
          자세히 →
        </Link>
      </section>

      {/* 왜 밸류맵 + 분석 대상 & 한계 — 통합 정보 섹션 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">왜 밸류맵인가</div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            한 종목을 PER만 보고 판단하는 시대는 끝났습니다. KRX 일별 종가, Naver Finance 재무, DART 공시까지 통합해 <strong className="text-zinc-900 dark:text-zinc-100">모멘텀 · 자금흐름 · 밸류 · 변동성조정</strong> 네 지표로 종목을 입체적으로 봅니다. 점수가 어떻게 계산되는지 <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline">전부 공개</Link>되어 있고, 추측 대신 검증된 데이터만 보여줍니다.
          </p>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">분석 대상 & 한계</div>
          <dl className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">왜 {dataMetadata.count}개 종목인가요?</dt>
              <dd>코스피·코스닥 시가총액 상위 + 거래 활발 + 테마 대표 종목 {dataMetadata.count}개. 풀이 너무 크면 신호의 의미가 흐려져서 의도적으로 좁혔습니다.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">데이터는 얼마나 자주 갱신되나요?</dt>
              <dd>매일 장 마감 후 자동 갱신 (주말·공휴일은 직전 영업일 데이터). 데이터 기준일은 상단에 표시됩니다.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">지표 점수의 한계는?</dt>
              <dd>네 지표는 모두 <strong className="text-zinc-900 dark:text-zinc-100">과거 데이터 기반</strong>입니다. 점수가 높다고 미래 수익을 보장하지 않으며, 점수가 낮아도 회복 구간일 수 있습니다. 항상 원문 공시·재무를 함께 확인하세요.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">투자 조언인가요?</dt>
              <dd>아닙니다. 밸류맵은 <strong className="text-zinc-900 dark:text-zinc-100">탐색 우선순위</strong>를 정하는 분석 도구입니다. 매수·매도 결정은 본인 책임입니다.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <strong className="text-zinc-700 dark:text-zinc-300">데이터 출처:</strong> KRX 일별 종가 (FinanceDataReader), Naver Finance PER/PBR/ROE, yfinance 보조 지표, DART 공시 실데이터. {dataMetadata.count}개 종목 · 매일 갱신.
        <div className="mt-3 flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
          <Link href="/about" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">서비스 소개</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">이용약관</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">개인정보처리방침</Link>
        </div>
      </section>
    </div>
  );
}
