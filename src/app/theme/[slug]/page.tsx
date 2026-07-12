import { notFound } from "next/navigation";
import Link from "next/link";
import { getThemeBySlug, getStocksInTheme } from "@/lib/mockData";
import { realStockPool } from "@/lib/realStocks";
import { keywordSentence, themeKeywords } from "@/lib/seoKeywords";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) return { title: "테마를 찾을 수 없습니다 — 오른스코어" };
  const keywords = themeKeywords(slug, theme.name);
  const title = `${theme.name} 관련주 테마 종목 — 오른스코어`;
  // 테마는 데이터 분류(그룹)일 뿐 투자 추천이 아니다 — 수익/급등/추천 표현 금지.
  const description = `${keywordSentence(keywords, 3)}를 자체 지표 4종(추세·거래활성도·밸류·위험조정)과 PER·PBR·ROE로 살펴보세요. 테마는 데이터 분류이며 투자 추천이 아닙니다.`;
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `/theme/${slug}`,
      siteName: "오른스코어",
      locale: "ko_KR",
      type: "website",
      // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
      images: ["/social/ornscore-og-1200x630.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: `/theme/${slug}` },
  };
}

export default async function ThemeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) notFound();

  const realThemeStocks = realStockPool.filter((s) => s.themes.includes(theme.name));
  const stocks = realThemeStocks.length > 0 ? realThemeStocks : getStocksInTheme(slug);
  const stockCount = stocks.length;

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/stocks">테마</Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-zinc-100">{theme.name}</span>
      </nav>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-medium">{theme.name}</h1>
            <span className="text-[11px] px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md">
              {theme.category}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            현재 분석 대상 매칭 {stockCount}개 · 자체 지표 종합 {theme.compositeScore} / 100
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {keywordSentence(themeKeywords(slug, theme.name), 4)} 검색 흐름에서 볼 수 있는 테마 분류입니다. 관련주 목록은 투자 추천이 아니라 데이터 비교 출발점입니다.
          </p>
        </div>
        <button className="px-3 py-1.5 border border-gray-300 dark:border-zinc-700 rounded-md text-sm">
          ☆ 관심테마 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="text-sm font-medium mb-3">자체 지표 4종</div>
          <RadarChart
            momentum={theme.momentum}
            flow={theme.flow}
            value={theme.value}
            vol={theme.vol}
          />
          <div className="text-[11px] text-gray-500 dark:text-zinc-400 text-center mt-2">
            4종 평균 <span className="font-medium text-brand-600">{theme.compositeScore}</span>
            {" "}/ 100
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-3">기간별 평균 수익률</div>
          <div className="grid grid-cols-2 gap-2">
            <ReturnCell label="1개월" value={theme.return1m} />
            <ReturnCell label="3개월" value={theme.return3m} />
            <ReturnCell label="6개월" value={theme.return6m} />
            <ReturnCell label="1년" value={theme.return1y} />
          </div>
          <div className="mt-2 p-3 bg-brand-50 rounded-md">
            <div className="text-[11px] text-brand-700 font-medium mb-0.5">
              오른스코어 평가
            </div>
            <div className="text-xs text-brand-700">
              {evaluate(theme.return1y, theme.value)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">소속 종목 {stockCount}개</span>
          <span className="text-[11px] text-brand-700">소외 정렬 ▼</span>
        </div>
        {stocks.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-8 text-center">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              현재 138개 분석 대상에는 {theme.name} 테마와 연결된 실데이터 종목이 없습니다.
            </div>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              테마명이 바뀌었거나 아직 커버리지에 포함되지 않았을 수 있습니다. 종목명·코드 검색에서 직접 확인해보세요.
            </p>
            <Link
              href={`/stocks?q=${encodeURIComponent(theme.name)}`}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              종목 검색으로 확인
            </Link>
          </div>
        ) : (
        <div className="overflow-x-auto -mx-1 px-1"><table className="w-full text-sm min-w-[360px]">
          <thead>
            <tr className="text-[11px] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
              <th className="text-left py-1.5 font-normal">종목</th>
              <th className="text-right py-1.5 font-normal">현재가</th>
              <th className="text-right py-1.5 font-normal">등락률</th>
              <th className="text-right py-1.5 font-normal">소외</th>
              <th className="text-right py-1.5 font-normal">밸류</th>
              <th className="text-right py-1.5 font-normal">PER</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.ticker} className="border-b border-gray-100 dark:border-zinc-800">
                <td className="py-2">
                  <Link
                    href={`/stock/${s.ticker}`}
                    className="hover:text-brand-600"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="text-right py-2">
                  {s.currentPrice.toLocaleString()}
                </td>
                <td
                  className={`text-right py-2 ${
                    s.changePct >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {s.changePct >= 0 ? "+" : ""}
                  {s.changePct.toFixed(2)}%
                </td>
                <td className="text-right py-2 text-brand-600 font-medium">
                  {s.neglectScore}
                </td>
                <td className="text-right py-2">{s.value}</td>
                <td className="text-right py-2">{s.per.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )}
      </div>
    </div>
  );
}

function ReturnCell({ label, value }: { label: string; value: number }) {
  const color = value >= 0 ? "text-success" : "text-danger";
  return (
    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-md p-3">
      <div className="text-[11px] text-gray-500 dark:text-zinc-400">{label}</div>
      <div className={`text-lg font-medium ${color}`}>
        {value >= 0 ? "+" : ""}
        {value.toFixed(1)}%
      </div>
    </div>
  );
}

function RadarChart({
  momentum,
  flow,
  value,
  vol,
}: {
  momentum: number;
  flow: number;
  value: number;
  vol: number;
}) {
  // 4축 레이더 — 위(모멘텀) 오른쪽(거래활성도) 아래(밸류) 왼쪽(변동성조정)
  const cx = 120;
  const cy = 100;
  const r = 70;
  const pts = (s: number) => (s / 100) * r;

  const polygon = [
    [cx, cy - pts(momentum)],
    [cx + pts(flow), cy],
    [cx, cy + pts(value)],
    [cx - pts(vol), cy],
  ]
    .map((p) => p.join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 240 200" className="w-full h-[200px] text-zinc-500 dark:text-zinc-400">
      {[1, 0.75, 0.5, 0.25].map((s, i) => (
        <polygon
          key={i}
          points={`${cx},${cy - r * s} ${cx + r * s},${cy} ${cx},${cy + r * s} ${cx - r * s},${cy}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="0.5"
        />
      ))}
      <polygon
        points={polygon}
        fill="#3b82f6"
        fillOpacity="0.2"
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize="10" fill="currentColor">
        추세 {momentum}
      </text>
      <text x={cx + r + 12} y={cy + 4} fontSize="10" fill="currentColor">
        거래활성도 {flow}
      </text>
      <text x={cx} y={cy + r + 16} textAnchor="middle" fontSize="10" fill="currentColor">
        밸류 {value}
      </text>
      <text x={cx - r - 12} y={cy + 4} textAnchor="end" fontSize="10" fill="currentColor">
        위험조정 {vol}
      </text>
    </svg>
  );
}

function evaluate(return1y: number, valueScore: number): string {
  if (return1y < -15 && valueScore >= 80) {
    return `1년간 ${return1y.toFixed(1)}%로 소외 구간. 밸류 점수 ${valueScore}점 — 저평가 원인과 회복 근거를 함께 확인.`;
  }
  if (return1y >= 0) {
    return `최근 흐름이 양호. 급등 사유와 지속 가능성, 가격 부담을 함께 확인.`;
  }
  return `중간 구간. 추가 하락 요인과 반등 근거를 함께 확인.`;
}
