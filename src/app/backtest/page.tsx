import Link from "next/link";

export const metadata = {
  title: "백테스트 — 밸류맵",
  description: "5년치 실데이터 기반 전략 검증. 곧 출시 예정.",
};

export default function BacktestPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header>
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-900">← 홈으로</Link>
        <h1 className="text-2xl font-bold mt-2">백테스트 엔진</h1>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <h2 className="font-semibold text-amber-900 mb-2">개발 중입니다</h2>
            <p className="text-sm text-amber-800 leading-relaxed">
              5년치 KRX 일별 데이터로 자체 지표 4종 전략을 검증하는 엔진을 만들고 있습니다.
              완성되면 "저평가 Top 10 월별 리밸런싱" 같은 전략의 실제 누적 수익률·MDD·Sharpe·KOSPI 대비 알파를 모두 투명하게 공개합니다.
            </p>
            <p className="text-xs text-amber-700 mt-3">
              가짜 시뮬레이션 숫자를 보여주는 것보다 정직하게 "준비 중"이라고 말하는 게 맞다고 생각합니다.
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold mb-3">검증 예정 전략</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><span className="text-gray-400">01.</span>밸류 점수 상위 10개 월별 리밸런싱 (저평가 전략)</li>
          <li className="flex gap-2"><span className="text-gray-400">02.</span>모멘텀 점수 상위 10개 월별 리밸런싱 (추세 추종)</li>
          <li className="flex gap-2"><span className="text-gray-400">03.</span>종합 점수 상위 10개 월별 리밸런싱 (균형)</li>
          <li className="flex gap-2"><span className="text-gray-400">04.</span>밸류 상위 & 모멘텀 상위 교집합 (가치+모멘텀)</li>
        </ul>
      </section>

      <section className="text-xs text-gray-500 leading-relaxed">
        <strong className="text-gray-700">사용 데이터:</strong> KRX 일별 종가 (FDR 경유), Naver Finance PER/PBR/ROE, yfinance 보조 지표. 138개 종목, 5년치.
      </section>
    </div>
  );
}