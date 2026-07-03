import Link from "next/link";
import { realStockPool, dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import { compositeOf } from "@/lib/score";
import { sectorOf } from "@/lib/sector";
import { dataStatus } from "@/lib/dataStatus";

const universeDescription =
  "오른스코어가 분석하는 한국 주식 전체 목록과 선정 기준, 데이터 기준일, 한계를 공개합니다.";

export const metadata = {
  title: "분석 대상 종목 — 오른스코어",
  description: universeDescription,
  openGraph: {
    title: "분석 대상 종목 — 오른스코어",
    description: universeDescription,
    url: "/universe",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "분석 대상 종목 — 오른스코어",
    description: universeDescription,
  },
  alternates: { canonical: "/universe" },
};

export const revalidate = 3600;

export default function UniversePage() {
  const rows = [...realStockPool].sort((a, b) => compositeOf(b) - compositeOf(a));

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← 홈으로
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          분석 대상 종목
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          오른스코어의 모든 순위·점수는 아래 <strong>{dataMetadata.count}종목</strong> 안에서 계산됩니다.
          한국 주식 전체가 아닙니다.
        </p>
        <Link href="/status" className="text-xs text-blue-700 dark:text-blue-400 hover:underline">→ 데이터 상태·신선도 보기</Link>
      </header>

      {/* 데이터 기준 */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">데이터 기준</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">가격 기준일</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{formatBizDateLong(dataMetadata.asOfBusinessDate)} 장마감</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">분석 대상</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{dataMetadata.count}종목</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">산식 버전</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{dataStatus.metricsVersionLabel}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500">마지막 계산</div>
            <div className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{dataMetadata.generatedAt?.slice(0, 10) ?? "—"}</div>
          </div>
        </div>
      </section>

      {/* 선정 기준 + 한계 */}
      <section className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">선정 기준과 한계</h2>
        <p>
          코스피·코스닥 시가총액 상위, 거래가 활발한 종목, 주요 테마 대표 종목을 중심으로 구성했습니다.
          베타 기간에는 데이터 품질이 검증된 대표 종목부터 제공하며, 분석 대상은 점진적으로 확대할 예정입니다.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>점수·순위는 모두 이 {dataMetadata.count}종목 안의 상대 위치입니다.</li>
          <li>가격·지표는 <strong>장 마감 종가 기준</strong>이며 장중 실시간이 아닙니다(현재가만 지연 시세 참고 제공).</li>
          <li>점수는 매수·매도 추천이 아니라 <strong>추가로 확인할 종목의 우선순위</strong>입니다.</li>
          <li>일부 종목은 적자·결측으로 가치 점수가 계산되지 않을 수 있습니다(임의 중립값으로 채우지 않습니다).</li>
        </ul>
      </section>

      {/* 전체 목록 */}
      <section>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          전체 목록 <span className="text-xs font-normal text-zinc-400">탐색 우선도 높은 순</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-left">
                <th className="py-2 px-3 font-medium">순위</th>
                <th className="py-2 px-3 font-medium">종목</th>
                <th className="py-2 px-3 font-medium">코드</th>
                <th className="py-2 px-3 font-medium">시장</th>
                <th className="py-2 px-3 font-medium">업종</th>
                <th className="py-2 px-3 font-medium text-right">탐색 우선도</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.ticker} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="py-1.5 px-3 tabular-nums text-zinc-500 dark:text-zinc-400">{i + 1}</td>
                  <td className="py-1.5 px-3">
                    <Link href={"/stock/" + s.ticker} className="text-blue-700 dark:text-blue-400 hover:underline font-medium">
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-1.5 px-3 tabular-nums font-mono text-zinc-500 dark:text-zinc-400">{s.ticker}</td>
                  <td className="py-1.5 px-3 text-zinc-500 dark:text-zinc-400">{s.market ?? "—"}</td>
                  <td className="py-1.5 px-3 text-zinc-500 dark:text-zinc-400">{sectorOf(s.themes)}</td>
                  <td className="py-1.5 px-3 text-right tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">{Math.round(compositeOf(s))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
