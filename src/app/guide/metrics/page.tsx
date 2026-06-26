import Link from "next/link";
import { dataMetadata } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";

export const metadata = {
  title: "지표 가이드 — 오른스코어",
  description: "자체 지표 4종이 어떻게 계산되고 어떻게 해석되는지 투명하게 공개합니다.",
};

const METRICS = [
  {
    id: "momentum",
    name: "추세 (모멘텀)",
    color: "bg-blue-500",
    desc: "최근 1개월·3개월·6개월 수익률을 가중평균한 추세 지표.",
    calc: "1개월(30%) + 3개월(40%) + 6개월(30%) 가중평균 수익률을 구한 뒤, 전체 종목 내 백분위(0~100)로 환산. 상위일수록 100에 가까움.",
    detail: "수익률 산정: 수정종가 기준 · 기간: 1·3·6개월(약 21·63·126거래일) · 고정 구간 매핑 대신 전체 백분위를 써 고점 포화(여러 종목이 100점) 문제를 제거.",
    high: "최근 추세가 강한 상태. 단, 고점 추격의 위험도 함께 의미합니다.",
    low: "최근 흐름이 부진합니다. 저평가 여부는 재무·공시로 별도 확인하세요.",
  },
  {
    id: "flow",
    name: "거래활성도",
    color: "bg-green-500",
    desc: "최근 거래량 변화로 측정한 시장 관심도 지표.",
    calc: "최근 5일 평균 거래량 / 20일 평균 거래량 비율. 1배 = 50점, 2배 = 75점, 3배+ = 100점.",
    detail: "기준: 최근 5거래일 vs 20거래일 평균 거래량 · 한계: 거래대금·가격 방향·수급(외국인/기관)은 미반영(순수 거래량 변화).",
    high: "거래량이 평소보다 크게 증가. 시장의 관심이 쏠리는 구간.",
    low: "거래량이 평소보다 줄어든 상태. 관심도 낮음 또는 횡보 중.",
  },
  {
    id: "value",
    name: "밸류",
    color: "bg-cyan-500",
    desc: "전체 풀 안에서의 상대적 저평가 정도 (PER·PBR 분위).",
    calc: "PER 분위(낮을수록 점수↑) + PBR 분위 평균. 100 = 풀에서 가장 저PER·저PBR.",
    detail: `분위 기준: 전체 ${dataMetadata.count}개 종목 풀 · 한계: 업종 차이 미보정(금융·지주사가 구조적으로 상위에 몰릴 수 있음) — 업종 분위 보정 개발 중.`,
    high: "전체 풀에서 상대적으로 저평가된 위치. 단, 이유 있는 저평가일 수 있습니다.",
    low: "전체 풀에서 상대적으로 고평가. 성장 기대치가 가격에 이미 반영됐을 수 있습니다.",
  },
  {
    id: "vol",
    name: "위험조정 (변동성조정)",
    color: "bg-orange-500",
    desc: "연간화 수익률을 연간화 변동성으로 나눈 위험조정 수익 (Sharpe 유사).",
    calc: "(연간 수익 - 무위험률 3.5%) / 연간 변동성. -2~+2 범위를 0~100점으로 매핑.",
    detail: "기간: 최근 1년(약 252거래일) · 수익률: 수정종가 일별 · 무위험률: 연 3.5% · 최소 관측치 미달 시 중립 처리.",
    high: "관측 기간 변동성 대비 수익이 양호했던 구간입니다. 과거 기준이며 향후를 보장하지 않습니다.",
    low: "변동성 대비 수익이 부진. 흔들림은 큰데 결과가 못 따라간 상태일 수 있습니다.",
  },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header>
        <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">← 홈으로</Link>
        <h1 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">지표 가이드</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
          오른스코어는 한 종목을 네 각도로 봅니다. 각 지표가 어떻게 계산되고 무엇을 의미하는지 모두 공개합니다.
        </p>
      </header>

      <nav className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex gap-2 flex-wrap text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium">바로 가기:</span>
        {METRICS.map((m) => (
          <Link key={m.id} href={"#" + m.id} className="text-blue-700 dark:text-blue-400 hover:underline">{m.name}</Link>
        ))}
      </nav>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong>이 도구는 투자 추천이 아닙니다.</strong> 자체 지표는 <strong>어떤 종목을 더 자세히 들여다볼지</strong>를 정하는 <strong>탐색 우선순위</strong>에 도움을 주는 신호이며, 매수·매도 판단의 근거가 아닙니다. 모든 투자 결정과 책임은 사용자 본인에게 있습니다.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-200">읽기 전 검토 포인트</h2>
        <ul className="list-none pl-0 space-y-1.5 text-xs text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
          <li>· <strong>종합점수는 네 지표를 똑같은 비중으로 평균합니다.</strong> 추세 · 거래활성도 · 밸류 · 위험조정 <strong>4지표를 각각 25%씩 동일 가중</strong>으로 더해 평균한 값이라, 한 지표만 아주 높아도 나머지가 평범하면 종합점수는 중간대에 머뭅니다. 종목 상세의 <strong>점수 근거 보기</strong>에서 각 지표가 종합점수에 얼마나 기여했는지 확인할 수 있습니다.</li>
          <li>· <strong>점수와 순위는 다릅니다.</strong> 점수는 0~100 절대값이고, 상대순위는 전체 풀에서 몇 번째인지를 나타냅니다. 같은 52점이라도 분포에 따라 순위는 달라지므로 둘을 같은 의미로 보면 안 됩니다. 종목 상세는 <strong>점수</strong>와 <strong>상대순위</strong>를 분리해 표시합니다.</li>
          <li>· <strong>밸류 점수의 기준에 주의하세요.</strong> 밸류는 <strong>전체 {dataMetadata.count}개 풀</strong> 분위라 업종 차이를 보정하지 않습니다 — 금융·지주사처럼 구조적으로 저PER·저PBR인 업종이 상위에 몰릴 수 있습니다. 종목 상세의 <strong>업종 대비 밸류</strong>는 같은 업종 안에서 다시 본 별도 참고 지표이며, 종합점수에는 포함되지 않습니다.</li>
        </ul>
      </div>

      {METRICS.map((m, i) => (
        <section key={m.name} id={m.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5 scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <span className={"w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold " + m.color}>
              {i + 1}
            </span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{m.name}</h2>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">{m.desc}</p>

          <details className="bg-zinc-50 dark:bg-zinc-800/50 rounded-md p-3 mb-3">
            <summary className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide cursor-pointer select-none">계산 방법 펼치기 ▾</summary>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">{m.calc}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5 pt-1.5 border-t border-zinc-200 dark:border-zinc-700">{m.detail}</p>
          </details>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-md p-3">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">점수가 높을 때 (70~100)</div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">{m.high}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-md p-3">
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">점수가 낮을 때 (0~30)</div>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">{m.low}</p>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-zinc-900 text-white rounded-lg p-3 md:p-5">
        <h2 className="text-lg font-semibold mb-2">종합 점수</h2>
        <p className="text-sm text-zinc-300 leading-relaxed mb-3">
          위 네 지표의 단순 평균입니다. 종합 점수가 높다는 건 <strong className="text-white">"네 각도에서 모두 우호적인 상태"</strong>로 해석할 수 있다는 뜻입니다.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          종합 점수는 매수 점수가 아니라 <strong className="text-white">탐색 우선순위</strong>입니다. 어떤 종목을 더 자세히 들여다볼지 정하는 데 활용하세요. 점수 100인 종목이 항상 좋은 투자라는 보장은 없습니다.
        </p>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-5">
        <h2 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">계산 공통 기준</h2>
        <ul className="list-none pl-0 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <li>· 가격은 <strong>수정종가</strong>(액면분할·배당락 반영) 기준으로 계산합니다.</li>
          <li>· 결측·거래정지 구간은 가능한 데이터만 사용하고, <strong>최소 관측치 미달 시 중립(50점)</strong>으로 처리합니다.</li>
          <li>· 무위험률은 <strong>연 3.5%</strong>를 단순 적용합니다 (정밀 기준일 보정은 추후 반영).</li>
          <li>· 종합점수의 <strong>밸류</strong>는 <strong>전체 {dataMetadata.count}개 기준</strong> 분위입니다. 종목 상세의 <strong>업종 대비 밸류</strong>는 별도 참고 지표로, <strong>종합점수에는 포함되지 않습니다.</strong></li>
          <li>· 점수는 <strong className="text-amber-700 dark:text-amber-400">실험 지표</strong>입니다 — 백테스트 검증이 진행 중이라 참고용입니다.</li>
          <li>· <strong className="text-zinc-900 dark:text-zinc-100">산식 버전: {dataStatus.metricsVersionLabel}</strong>{dataStatus.metricsEffectiveDate ? <span className="text-zinc-500 dark:text-zinc-400"> · 적용 {dataStatus.metricsEffectiveDate}</span> : null}. <strong>이 페이지의 설명은 실제 운영 계산식과 동일합니다.</strong> <Link href="/guide/metrics/changelog" className="text-blue-700 dark:text-blue-400 hover:underline">산식 변경 이력 보기</Link></li>
          <li>· 계산 코드 공개(산식 검증용) — <a href="https://github.com/songchankeun-ship-it/valuemap-poc/blob/main/scripts/compute_metrics.py" className="text-blue-700 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">compute_metrics.py</a> (실제 데이터 생성기) · <a href="https://github.com/songchankeun-ship-it/valuemap-poc/blob/main/src/lib/metrics.ts" className="text-blue-700 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">metrics.ts</a> (참조 구현). 점수는 <strong>탐색 우선순위</strong>이며 매수·매도 신호가 아닙니다.</li>
        </ul>
      </section>

      <section className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <strong className="text-zinc-700 dark:text-zinc-300">데이터 출처:</strong> KRX 일별 종가 (FinanceDataReader), Naver Finance PER·PBR·ROE, yfinance 보조 지표. {dataMetadata.count}개 종목. 영업일 마감 후 자동 갱신.
      </section>
    </div>
  );
}