import { notFound } from "next/navigation";
import Link from "next/link";
import { getThemeBySlug, getStocksInTheme } from "@/lib/mockData";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ThemeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) notFound();

  const stocks = getStocksInTheme(slug);

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/themes">테마</Link>
        <span>›</span>
        <span className="text-gray-900">{theme.name}</span>
      </nav>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-medium">{theme.name}</h1>
            <span className="text-[11px] px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md">
              {theme.category}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {theme.stockCount}개 종목 · 자체 지표 종합 {theme.compositeScore} / 100
          </p>
        </div>
        <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
          ☆ 관심테마 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium mb-3">자체 지표 4종</div>
          <RadarChart
            momentum={theme.momentum}
            flow={theme.flow}
            value={theme.value}
            vol={theme.vol}
          />
          <div className="text-[11px] text-gray-500 text-center mt-2">
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
              밸류맵 평가
            </div>
            <div className="text-xs text-brand-700">
              {evaluate(theme.return1y, theme.value)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">소속 종목 {theme.stockCount}개</span>
          <span className="text-[11px] text-brand-700">소외 정렬 ▼</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-500 border-b border-gray-200">
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
              <tr key={s.ticker} className="border-b border-gray-100">
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
    </div>
  );
}

function ReturnCell({ label, value }: { label: string; value: number }) {
  const color = value >= 0 ? "text-success" : "text-danger";
  return (
    <div className="bg-gray-50 rounded-md p-3">
      <div className="text-[11px] text-gray-500">{label}</div>
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
    <svg viewBox="0 0 240 200" className="w-full h-[200px]">
      {[1, 0.75, 0.5, 0.25].map((s, i) => (
        <polygon
          key={i}
          points={`${cx},${cy - r * s} ${cx + r * s},${cy} ${cx},${cy + r * s} ${cx - r * s},${cy}`}
          fill="none"
          stroke="#e5e7eb"
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
      <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize="10" fill="#374151">
        모멘텀 {momentum}
      </text>
      <text x={cx + r + 12} y={cy + 4} fontSize="10" fill="#374151">
        거래활성도 {flow}
      </text>
      <text x={cx} y={cy + r + 16} textAnchor="middle" fontSize="10" fill="#374151">
        밸류 {value}
      </text>
      <text x={cx - r - 12} y={cy + 4} textAnchor="end" fontSize="10" fill="#374151">
        변동성 {vol}
      </text>
    </svg>
  );
}

function evaluate(return1y: number, valueScore: number): string {
  if (return1y < -15 && valueScore >= 80) {
    return `1년간 ${return1y.toFixed(1)}%로 충분히 소외됨. 밸류 점수 ${valueScore}점으로 매수 검토 구간.`;
  }
  if (return1y >= 0) {
    return `최근 흐름이 양호. 무리한 추격보다는 분할 매수 권장.`;
  }
  return `중간 구간. 추가 하락 시 매수 매력 증대.`;
}
