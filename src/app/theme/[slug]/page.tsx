import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getThemeBySlug } from "@/lib/mockData";
import { realStockPool } from "@/lib/realStocks";
import { keywordSentence, themeKeywords } from "@/lib/seoKeywords";
import { legacyThemeRedirectTarget, isNoindexLegacyTheme } from "@/lib/seoContract";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 실데이터(138개 유니버스)에서 이 테마명과 연결된 종목만. 모의 종목 폴백은 쓰지 않는다
// (모의 종목/집계를 공개 근거로 노출 금지 — SEO authority Slice B).
function realStocksForTheme(themeName: string) {
  return realStockPool.filter((s) => s.themes.includes(themeName));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  // 은퇴한 테마는 authoritative /topics/* 로 영구 리다이렉트되므로 색인 대상이 아니다.
  if (legacyThemeRedirectTarget(slug)) {
    return { title: "이동 중 — 오른스코어", robots: { index: false, follow: true } };
  }

  const theme = getThemeBySlug(slug);
  if (!theme) return { title: "테마를 찾을 수 없습니다 — 오른스코어", robots: { index: false, follow: true } };

  // 실 커버리지가 없거나(noindex 처리) 실데이터 매칭이 0건이면 색인 금지 —
  // 모의 종목/집계를 공개 근거로 노출하지 않는다.
  const noindex = isNoindexLegacyTheme(slug) || realStocksForTheme(theme.name).length === 0;

  const keywords = themeKeywords(slug, theme.name);
  const title = `${theme.name} 관련주 테마 종목 — 오른스코어`;
  // 테마는 데이터 분류(그룹)일 뿐 투자 추천이 아니다 — 수익/급등/추천 표현 금지.
  const description = `${keywordSentence(keywords, 3)}를 자체 지표 4종(추세·거래활성도·밸류·위험조정)과 PER·PBR·ROE로 살펴보세요. 테마는 데이터 분류이며 투자 추천이 아닙니다.`;
  return {
    title,
    description,
    keywords,
    robots: noindex ? { index: false, follow: true } : undefined,
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
    // 색인 가능한 경우에만 self-canonical. noindex 상태에서는 canonical 을 두지 않는다.
    alternates: noindex ? undefined : { canonical: `/theme/${slug}` },
  };
}

export default async function ThemeDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 은퇴한 레거시 테마 → authoritative topic 으로 영구(308) 리다이렉트.
  // (next.config 리다이렉트가 먼저 처리하지만, 라우트 자체도 자기정합적으로 은퇴한다.)
  const redirectTarget = legacyThemeRedirectTarget(slug);
  if (redirectTarget) permanentRedirect(redirectTarget);

  const theme = getThemeBySlug(slug);
  if (!theme) notFound();

  // 오직 실데이터 종목만 — 모의 폴백 없음.
  const stocks = realStocksForTheme(theme.name);
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
            현재 분석 대상 매칭 {stockCount}개
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {keywordSentence(themeKeywords(slug, theme.name), 4)} 검색 흐름에서 볼 수 있는 테마 분류입니다. 관련주 목록은 투자 추천이 아니라 데이터 비교 출발점입니다.
          </p>
        </div>
        <button className="px-3 py-1.5 border border-gray-300 dark:border-zinc-700 rounded-md text-sm">
          ☆ 관심테마 추가
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">소속 종목 {stockCount}개</span>
          {stockCount > 0 && <span className="text-[11px] text-brand-700">소외 정렬 ▼</span>}
        </div>
        {stocks.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-8 text-center">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              현재 138개 분석 대상에는 {theme.name} 테마와 연결된 실데이터 종목이 없습니다.
            </div>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              실제 커버리지가 확보될 때까지 이 테마는 검색 색인 대상이 아닙니다. 종목명·코드 검색에서 직접 확인해보세요.
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
