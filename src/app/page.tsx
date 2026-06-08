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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-zinc-200 p-5 md:p-10">
        <span className="inline-block text-[10px] font-semibold tracking-widest text-blue-700 uppercase mb-3 px-2 py-0.5 rounded bg-white/60">
          한국 테마주 분석 도구 · 베타
        </span>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-zinc-900 leading-snug">
          지금 먼저 확인할 종목을,<br/>
          <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">네 가지 지표</span>로 좁혀보세요.
        </h1>
        <p className="text-sm md:text-base text-zinc-700 mt-4 max-w-xl leading-relaxed">
          추세 · 자금 흐름 · 저평가 · 위험 대비 수익.<br className="hidden md:inline"/>
          한 종목을 네 각도로 동시에 보는 탐색 우선순위 도구입니다.
        </p>
        <div className="flex gap-2 mt-5 flex-wrap">
          <Link href="/stocks" className="px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition shadow-sm">
            {dataMetadata.count}개 종목 둘러보기 →
          </Link>
          <Link href="/guide/metrics" className="px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 text-sm font-medium hover:border-zinc-400 transition">
            지표 어떻게 보나
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/stocks" className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-blue-400 transition">
          <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 mb-1">종목 탐색</div>
          <div className="text-xs text-zinc-600">{dataMetadata.count}개 종목을 자체 지표 4종으로 정렬·필터링</div>
        </Link>
        <Link href="/compare" className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-blue-400 transition">
          <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 mb-1">종목 비교</div>
          <div className="text-xs text-zinc-600">관심 종목 4개까지 PER·PBR·ROE 나란히</div>
        </Link>
        <Link href="/disclosures" className="block bg-white border border-zinc-200 rounded-xl p-4 hover:border-blue-400 transition">
          <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Megaphone className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 mb-1">공시 신호</div>
          <div className="text-xs text-zinc-600">DART 5종 신호 자동 분류 (자기주식·임원매수·정정·계약·증자)</div>
        </Link>
      </section>

      <section className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-4 md:p-5 flex items-center justify-between text-white shadow-md gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-blue-300 mb-1 uppercase tracking-wider">Coming Soon</div>
          <div className="text-base font-semibold">5년치 실데이터로 전략 검증</div>
          <div className="text-xs text-zinc-400 mt-0.5">백테스트 엔진 — 가짜 숫자 없이 정직하게</div>
        </div>
        <Link href="/backtest" className="px-4 py-2 bg-white text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition shrink-0">
          자세히 →
        </Link>
      </section>

      <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 md:p-5 text-sm text-zinc-700 leading-relaxed">
        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">왜 밸류맵인가</div>
        한 종목을 PER만 보고 판단하는 시대는 끝났습니다. KRX 일별 종가, Naver Finance 재무, DART 공시까지 통합해 <strong>모멘텀 · 자금흐름 · 밸류 · 변동성조정</strong> 네 지표로 종목을 입체적으로 봅니다. 점수가 어떻게 계산되는지 <Link href="/guide/metrics" className="text-blue-700 underline">전부 공개</Link>되어 있고, 추측 대신 검증된 데이터만 보여줍니다.
      </section>

      <section className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-200 pt-4">
        <strong className="text-zinc-700">데이터 출처:</strong> KRX 일별 종가 (FinanceDataReader), Naver Finance PER/PBR/ROE, yfinance 보조 지표, DART 공시 실데이터. {dataMetadata.count}개 종목 · 매일 갱신.
      </section>
    </div>
  );
}