import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, BookmarkPlus, Database, Search, ShieldCheck } from "lucide-react";
import { dataMetadata, formatBizDateLong, type RealStock } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";
import { getSeoTopic, seoTopics } from "@/lib/seoTopics";
import { metricKeywords, stockDiscoveryKeywords, trustKeywords, uniqueKeywords } from "@/lib/seoKeywords";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatWon(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "-";
  return `${Math.round(price).toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number, digits = 1, suffix = ""): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${value.toFixed(digits)}${suffix}`;
}

function topicScore(stock: RealStock, metric: string): string {
  if (metric === "PER") return formatNumber(stock.per, 1);
  if (metric === "PBR") return formatNumber(stock.pbr, 2);
  if (metric === "ROE") return formatNumber(stock.roe, 1, "%");
  if (metric === "배당수익률") return formatNumber(stock.dividendYield, 1, "%");
  if (metric === "밸류") return String(Math.round(stock.value));
  return String(Math.round(stock.compositeScore ?? 0));
}

export function generateStaticParams() {
  return seoTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getSeoTopic(slug);
  if (!topic) {
    return {
      title: "종목 탐색 주제를 찾을 수 없습니다 | 오른스코어",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${topic.title} | 오른스코어`,
    description: topic.description,
    keywords: uniqueKeywords(topic.keywords, stockDiscoveryKeywords, metricKeywords, trustKeywords),
    alternates: { canonical: `/topics/${topic.slug}` },
    openGraph: {
      title: `${topic.title} | 오른스코어`,
      description: topic.description,
      url: `/topics/${topic.slug}`,
      siteName: "오른스코어",
      locale: "ko_KR",
      type: "website",
      images: ["/social/ornscore-og-1200x630.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.title} | 오른스코어`,
      description: topic.description,
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getSeoTopic(slug);
  if (!topic) notFound();

  const stocks = topic.stockSelector();
  const dataAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: topic.h1,
    description: topic.description,
    url: `https://ornscore.com/topics/${topic.slug}`,
    about: topic.keywords.slice(0, 5),
    isPartOf: {
      "@type": "WebSite",
      name: "오른스코어",
      url: "https://ornscore.com",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: stocks.slice(0, 8).map((stock, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${stock.name} (${stock.ticker})`,
        url: `https://ornscore.com/stock/${stock.ticker}`,
      })),
    },
  };

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blue-700 dark:hover:text-blue-400">
          홈
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/stocks" className="hover:text-blue-700 dark:hover:text-blue-400">
          종목 탐색
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">{topic.shortLabel}</span>
      </nav>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {topic.category}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {dataAsOf} 기준
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50 md:text-3xl">
            {topic.h1}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {topic.intro}
          </p>
          <div className="flex flex-wrap gap-2">
            {topic.keywords.slice(0, 5).map((keyword) => (
              <span
                key={keyword}
                className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            탐색 기준
          </div>
          <dl className="space-y-3 text-xs">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">정렬</dt>
              <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{topic.selectionLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">표본</dt>
              <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                분석 대상 {dataMetadata.count}개 중 {stocks.length}개 표시
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">주의</dt>
              <dd className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-300">
                투자 추천이 아니라 더 볼 종목을 고르는 탐색 화면입니다.
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex gap-2 text-xs">
              <BookmarkPlus className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">이 주제를 루틴으로 남기기</div>
                <p className="mt-1 leading-5 text-zinc-500 dark:text-zinc-400">
                  종목 탐색에서 조건을 더한 뒤 <strong className="font-semibold text-zinc-700 dark:text-zinc-200">조건 저장</strong>을 누르면 관심 화면에서 다시 불러올 수 있어요.
                </p>
              </div>
            </div>
            <Link
              href={topic.stocksHref}
              data-analytics-event="topic_saved_filter_start"
              data-analytics-topic={topic.slug}
              data-analytics-filtered={topic.stocksHref.includes("?") ? "true" : "false"}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              조건 저장하러 가기
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Topic summary">
        <SummaryItem icon={Search} label="검색 의도" value={topic.shortLabel} />
        <SummaryItem icon={BarChart3} label="핵심 지표" value={topic.primaryMetric} />
        <SummaryItem icon={Database} label="데이터" value={`Metrics ${dataMetadata.metricsVersion ?? "-"}`} />
      </section>

      <section className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">후보 종목</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{topic.filterNote}</p>
          </div>
          <Link
            href={topic.stocksHref}
            data-analytics-event="topic_all_stocks_click"
            data-analytics-topic={topic.slug}
            className="inline-flex min-h-10 items-center gap-1 rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
          >
            전체 탐색
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/70 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">종목</th>
                <th className="px-3 py-2.5 font-semibold">업종</th>
                <th className="px-3 py-2.5 text-right font-semibold">현재가</th>
                <th className="px-3 py-2.5 text-right font-semibold">{topic.primaryMetric}</th>
                <th className="px-3 py-2.5 text-right font-semibold">PER</th>
                <th className="px-3 py-2.5 text-right font-semibold">PBR</th>
                <th className="px-3 py-2.5 text-right font-semibold">ROE</th>
                <th className="px-3 py-2.5 text-right font-semibold">배당</th>
                <th className="px-4 py-2.5 text-right font-semibold">보기</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => {
                const up = stock.changePct >= 0;
                return (
                  <tr key={stock.ticker} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/stock/${stock.ticker}`}
                        data-analytics-event="topic_stock_open"
                        data-analytics-topic={topic.slug}
                        data-analytics-ticker={stock.ticker}
                        className="group inline-flex min-w-0 flex-col"
                      >
                        <span className="font-semibold text-zinc-900 group-hover:text-blue-700 dark:text-zinc-100 dark:group-hover:text-blue-400">
                          {stock.name}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">{stock.ticker}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">{sectorOf(stock.themes, stock.ticker)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatWon(stock.currentPrice)}</div>
                      <div className={up ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>
                        {up ? "+" : ""}
                        {stock.changePct.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                      {topicScore(stock, topic.primaryMetric)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{formatNumber(stock.per, 1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{formatNumber(stock.pbr, 2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{formatNumber(stock.roe, 1, "%")}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatNumber(stock.dividendYield, 1, "%")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/stock/${stock.ticker}`}
                        data-analytics-event="topic_stock_open"
                        data-analytics-topic={topic.slug}
                        data-analytics-ticker={stock.ticker}
                        className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 px-2.5 text-[11px] font-medium text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">이 화면을 보는 방법</h2>
          <p className="mt-2 text-xs leading-6 text-zinc-600 dark:text-zinc-300">
            숫자가 좋아 보이는 종목도 업종, 최근 공시, 가격 기준일, 변동성을 함께 확인해야 합니다. 오른스코어의 점수는 종목을
            더 빨리 좁히기 위한 보조 지표이며 매수·매도 판단을 대신하지 않습니다.
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">다음 확인</h2>
          <div className="mt-3 grid gap-2 text-xs">
            <Link href="/guide/metrics" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              PER·PBR·ROE 기준 보기
            </Link>
            <Link href="/disclosures" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              최근 DART 공시 신호 보기
            </Link>
            <Link href="/status" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              데이터 기준일 확인
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Search;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}
