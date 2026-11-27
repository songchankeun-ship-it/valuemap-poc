// /compare/[pair] — 큐레이션 종목 비교 랜딩(정적 생성) — Slice C.
//
// Slice A 허용목록의 정확히 7쌍만 정적 생성·색인한다. dynamicParams=false 로
// 미허용·역순 슬러그는 404(대체 canonical/색인 페이지가 생기지 않는다).
// 콘텐츠·메타데이터·JSON-LD·차이 문장은 전부 src/lib/comparison.ts 에서 파생한다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, GitCompare } from "lucide-react";
import { dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import {
  resolveComparison,
  comparisonMetadata,
  comparisonBreadcrumbJsonLd,
  comparisonStaticParams,
  type ComparisonMetric,
  type ResolvedComparison,
} from "@/lib/comparison";
import { conjunctionParticle } from "@/lib/particle";
import { curatedCompareSharePath } from "@/lib/growthShare";
import { EvidenceShareButton } from "@/components/EvidenceShareButton";
import { PairPriceChart } from "@/components/research/PairPriceChart";
import { financialEvidenceCopy } from "@/lib/financialEvidence";

// 허용목록의 7쌍만 정적 생성. 그 외 슬러그는 생성/색인되지 않는다.
export const dynamicParams = false;

export function generateStaticParams() {
  return comparisonStaticParams();
}

interface PageProps {
  params: Promise<{ pair: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const meta = comparisonMetadata(pair);
  if (!meta) {
    return { title: "비교를 찾을 수 없습니다 — 오른스코어", robots: { index: false, follow: true } };
  }
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.canonical,
      siteName: "오른스코어",
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

function ComparisonTable({ rows, data }: { rows: ComparisonMetric[]; data: ResolvedComparison }) {
  const basis = financialEvidenceCopy.ko;
  const columns = [
    { stock: data.a, href: `/stock/${data.a.ticker}` },
    { stock: data.b, href: `/stock/${data.b.ticker}` },
  ];
  return (
    <table className="research-table mt-2 text-left">
      <thead>
        <tr>
          <th scope="col" className="text-xs text-[var(--muted)]">지표</th>
          {columns.map(({ stock, href }) => (
            <th scope="col" key={stock.ticker} className="text-right">
              <Link href={href} className="research-link text-xs break-keep">{stock.name}</Link>
              <span className="block text-[10px] font-normal font-mono text-[var(--muted)]">{stock.ticker}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((metric) => (
          <tr key={metric.key}>
            <th scope="row" className="text-xs font-semibold text-[var(--foreground)]">
              {metric.label}
              <span className="block text-[10px] font-normal leading-tight text-[var(--muted)]">{metric.hint}</span>
            </th>
            {(["a", "b"] as const).map((side) => (
              <td key={side} className={`text-right font-mono text-[13px] ${metric.higher === side && metric.a.display !== metric.b.display ? "font-bold" : "text-[var(--muted)]"}`}>
                {metric[side].display}
                {metric.key === "composite" && data[side].valuationBasis === "three-factors" ? (
                  <small className="research-matrix-basis">{basis.threeFactors}</small>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const FINANCIAL_KEYS = new Set(["per", "pbr", "roe", "dividendYield", "marketCap"]);

export default async function ComparePairPage({ params }: PageProps) {
  const { pair } = await params;
  const data = resolveComparison(pair);
  const meta = comparisonMetadata(pair);
  if (!data || !meta) notFound();

  const jsonLd = comparisonBreadcrumbJsonLd(data);
  const dataAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate);
  const fundamentals = data.metrics.filter((m) => FINANCIAL_KEYS.has(m.key));
  const scores = data.metrics.filter((m) => !FINANCIAL_KEYS.has(m.key));

  return (
    <div className="research-desk space-y-5 pb-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]" aria-label="Breadcrumb">
        <Link href="/" className="research-link">홈</Link>
        <span aria-hidden="true">/</span>
        <Link href="/compare" className="research-link">종목 비교</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{data.a.name} vs {data.b.name}</span>
      </nav>

      <header className="border-b border-[var(--research-line)] pb-4">
        <p className="research-section-label tabular-nums">{financialEvidenceCopy.ko.priceBasis} · {dataAsOf}</p>
        <h1 className="mt-1 text-[29px] font-extrabold leading-tight text-[var(--foreground)] break-keep">{meta.h1}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)] break-keep">
          {`${data.a.name}${conjunctionParticle(data.a.name)} ${data.b.name}의 재무 지표와 공통 거래일의 종가 흐름을 비교합니다.`}
        </p>
        <div className="mt-3 flex flex-wrap items-stretch gap-2">
          <Link
            href={data.interactiveHref}
            data-analytics-event="compare_curated_interactive_open"
            data-analytics-count={2}
            className="research-button"
          >
            <GitCompare className="h-4 w-4 shrink-0" aria-hidden="true" />
            직접 비교 열기
          </Link>
          <EvidenceShareButton
            path={curatedCompareSharePath(pair)}
            title={`${data.a.name} vs ${data.b.name} · 오른스코어 비교`}
            text="예측이나 추천 대신 같은 기준의 숫자와 다음 확인 순서를 나란히 비교해 보세요."
            analytics={{ kind: "compare", count: 2, surface: "curated" }}
            label="이 비교 공유"
          />
        </div>
      </header>

      <div className="research-split">
        <section aria-labelledby="pair-fundamentals" className="min-w-0">
          <h2 id="pair-fundamentals" className="text-lg font-bold">재무 지표</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{financialEvidenceCopy.ko.financialPeriod} · {financialEvidenceCopy.ko.financialSources}</p>
          <ComparisonTable rows={fundamentals} data={data} />
        </section>
        <PairPriceChart a={data.a} b={data.b} asOf={dataMetadata.asOfBusinessDate} />
      </div>

      <section aria-labelledby="pair-scores">
        <h2 id="pair-scores" className="text-lg font-bold">오른스코어 지표</h2>
        <ComparisonTable rows={scores} data={data} />
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">높고 낮음은 숫자의 차이이며, 종목의 우열을 뜻하지 않습니다.</p>
      </section>

      <div className="border-y border-[var(--research-line)] divide-y divide-[var(--research-line)]">
        <details>
          <summary className="cursor-pointer py-3 text-sm font-semibold">수치 차이 요약</summary>
          <ul className="list-disc space-y-1 pb-3 pl-5 text-xs leading-6 text-[var(--muted)]">
            {data.metrics.map((m) => (
              <li key={m.key}>
                {m.a.valid && m.b.valid && m.a.display === m.b.display
                  ? `${m.label}: 두 종목에 표시된 값은 ${m.a.display}입니다.`
                  : m.sentence}
              </li>
            ))}
          </ul>
        </details>
        <details>
          <summary className="cursor-pointer py-3 text-sm font-semibold">비교의 한계</summary>
          <ul className="list-disc space-y-1 pb-3 pl-5 text-xs leading-6 text-[var(--muted)]">
            {data.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </details>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <Link href="/guide/metrics" className="research-link inline-flex min-h-11 items-center gap-1">지표 산식 <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
        <Link href="/compare" className="research-link inline-flex min-h-11 items-center gap-1">다른 종목 비교 <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
