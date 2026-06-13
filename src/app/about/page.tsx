import Link from "next/link";
import { dataMetadata } from "@/lib/realStocks";
import { Mail, Database, Code, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "서비스 소개 — 밸류맵 스톡",
  description: "밸류맵이 누구를, 어떤 목적으로 만들어진 도구인지.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-10 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">서비스 소개</h1>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          밸류맵은 한국 개인 투자자가 <strong className="text-zinc-900 dark:text-zinc-100">"오늘 어떤 종목부터 봐야 할지"</strong>를 데이터로 빠르게 좁히는 분석 도구입니다.
        </p>
      </header>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">왜 만들었나요?</h2>
        <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <p>
            한국 주식 시장에는 약 2,500개 이상의 상장 종목이 있습니다. 매일 모든 종목을 일일이 분석하는 건 현실적으로 불가능합니다.
          </p>
          <p>
            대부분의 개인 투자자는 종목 후보를 좁히는 데 시간을 가장 많이 씁니다. PER만 보면 다른 지표를 놓치고, 모멘텀만 보면 고평가 위험을 놓칩니다. 그래서 <strong className="text-zinc-900 dark:text-zinc-100">한 종목을 여러 각도로 동시에 보는 도구</strong>가 필요했습니다.
          </p>
          <p>
            밸류맵은 <strong>모멘텀(추세) · 거래활성도(거래) · 밸류(저평가) · 변동성조정(위험 대비)</strong> 네 지표로 종목을 입체적으로 봅니다. 각 점수는 공개된 산식으로 계산되며, 어떤 데이터로 어떻게 만들어졌는지 모두 투명하게 공개합니다.
          </p>
        </div>
      </section>

      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">밸류맵은 투자 추천이 아닙니다</h2>
        </div>
        <div className="space-y-2 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          <p>
            본 서비스는 <strong>투자 추천, 매수·매도 권유, 투자자문을 제공하지 않습니다.</strong> 제공되는 정보는 공개 데이터와 자체 계산 기준에 따른 참고 자료이며, 실제 투자 판단과 그 결과에 대한 책임은 사용자 본인에게 있습니다.
          </p>
          <p>
            점수가 높은 종목이 반드시 좋은 종목이라는 의미가 아닙니다. 점수는 과거 데이터 기반의 <strong>탐색 우선순위</strong>를 의미하며, 미래 수익을 보장하지 않습니다.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">데이터 출처와 갱신 주기</h2>
        </div>
        <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>KRX 일별 종가</strong> (FinanceDataReader) — 매일 장 마감 후 자동 갱신</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>Naver Finance</strong> — PER · PBR · ROE · 배당수익률</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>yfinance</strong> — 외국인·기관 보조 지표</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>DART</strong> — 공시 실데이터 (자기주식·임원·주요주주 보유변동·정정·계약·자금조달)</span>
          </li>
        </ul>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          일부 데이터는 출처 시스템의 갱신 지연이나 휴장일 영향으로 1~2 영업일 지연될 수 있습니다. 데이터 기준일은 항상 상단 회색 바에 표시됩니다.
        </p>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">분석 대상 & 산식</h2>
        </div>
        <dl className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <div>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">분석 종목</dt>
            <dd>코스피·코스닥 시가총액 상위 + 거래 활발 + 테마 대표 {dataMetadata.count}개 종목. 풀이 너무 크면 신호의 의미가 흐려져 의도적으로 좁혔습니다.</dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">점수 산식</dt>
            <dd>각 지표의 계산식과 가중치는 <Link href="/guide/metrics" className="text-blue-600 dark:text-blue-400 underline">지표 가이드</Link>에 전부 공개되어 있습니다.</dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">데이터 한계</dt>
            <dd>모든 지표는 과거 데이터 기반입니다. 미래 수익을 보장하지 않으며, 점수가 낮아도 회복 구간일 수 있습니다.</dd>
          </div>
        </dl>
      </section>

      <section className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">문의 & 오류 제보</h2>
        </div>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>데이터 오류, 기능 제안, 협업 문의는 아래로 연락해주세요:</p>
          <p className="font-mono text-zinc-900 dark:text-zinc-100">
            <a href="mailto:songchankeun@gmail.com" className="text-blue-600 dark:text-blue-400 underline">songchankeun@gmail.com</a>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            운영: 송찬근 / 필로소디 · 한국 개인 투자자를 위한 사이드 프로젝트로 시작되었습니다.
          </p>
        </div>
      </section>

      <section className="text-xs text-zinc-500 dark:text-zinc-400 text-center border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">이용약관</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">개인정보처리방침</Link>
        <span className="mx-2">·</span>
        <Link href="/guide/metrics" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">지표 가이드</Link>
      </section>
    </div>
  );
}
