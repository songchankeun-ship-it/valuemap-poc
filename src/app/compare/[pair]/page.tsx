// /compare/[pair] — 큐레이션 종목 비교 랜딩(정적 생성) — Slice C.
//
// Slice A 허용목록의 정확히 7쌍만 정적 생성·색인한다. dynamicParams=false 로
// 미허용·역순 슬러그는 404(대체 canonical/색인 페이지가 생기지 않는다).
// 콘텐츠·메타데이터·JSON-LD·차이 문장은 전부 src/lib/comparison.ts 에서 파생한다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import {
  resolveComparison,
  comparisonMetadata,
  comparisonBreadcrumbJsonLd,
  comparisonStaticParams,
} from "@/lib/comparison";
import { conjunctionParticle } from "@/lib/particle";

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
      images: ["/social/ornscore-og-1200x630.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function ComparePairPage({ params }: PageProps) {
  const { pair } = await params;
  const data = resolveComparison(pair);
  const meta = comparisonMetadata(pair);
  if (!data || !meta) notFound();

  const jsonLd = comparisonBreadcrumbJsonLd(data);
  const dataAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blue-700 dark:hover:text-blue-400">홈</Link>
        <span aria-hidden="true">/</span>
        <Link href="/compare" className="hover:text-blue-700 dark:hover:text-blue-400">종목 비교</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">{data.a.name} vs {data.b.name}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {dataAsOf} 기준
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50 md:text-3xl">
          {meta.h1}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <Link href={`/stock/${data.a.ticker}`} className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            {data.a.name}
          </Link>
          <span className="text-zinc-400">({data.a.sector})</span>
          {/* 두 종목명을 잇는 접속 조사 — 문법적 머리인 앞 종목명(data.a.name)의 받침으로 결정(메타 설명과 동일 규칙). */}
          {` ${conjunctionParticle(data.a.name)} `}
          <Link href={`/stock/${data.b.ticker}`} className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            {data.b.name}
          </Link>
          <span className="text-zinc-400">({data.b.sector})</span>
          {" 의 자체 지표 4종과 PER·PBR·ROE, 배당수익률, 시가총액을 나란히 봅니다. 어느 쪽이 높고 낮은지만 중립적으로 보여주며, 어떤 종목이 더 낫다는 판단은 하지 않습니다."}
        </p>
      </header>

      {/* 두 종목 헤더 링크 — 각 종목 상세로 이어지는 서버 렌더 내부 링크 */}
      <section className="grid gap-3 sm:grid-cols-2" aria-label="비교 종목">
        {[data.a, data.b].map((s) => (
          <Link
            key={s.ticker}
            href={`/stock/${s.ticker}`}
            className="rounded-md border border-zinc-200 bg-white p-4 transition hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">{s.ticker}</span>
              <span aria-hidden="true">·</span>
              <span>{s.sector}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* 지표 나란히 표 — 높은 쪽을 중립적으로 표시(더 좋음/나쁨 아님) */}
      <section className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">지표 나란히 보기</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            값이 더 높은 쪽에 표시가 붙습니다. 높다·낮다는 사실일 뿐, 더 좋은 종목이라는 뜻은 아닙니다.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/70 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">지표</th>
                <th className="px-3 py-2.5 text-right font-semibold">{data.a.name}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{data.b.name}</th>
                <th className="px-4 py-2.5 font-semibold">더 높은 쪽</th>
              </tr>
            </thead>
            <tbody>
              {data.metrics.map((m) => {
                const higherName = m.higher === "a" ? data.a.name : m.higher === "b" ? data.b.name : m.higher === "tie" ? "동일" : "비교 불가";
                return (
                  <tr key={m.key} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{m.label}</div>
                      <div className="text-[10px] text-zinc-400">{m.hint}</div>
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums ${m.higher === "a" ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-300"}`}>
                      {m.a.display}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums ${m.higher === "b" ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-300"}`}>
                      {m.b.display}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{higherName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 중립 차이 요약 문장(서버 렌더 고유 본문) */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">한눈에 보는 차이</h2>
        <ul className="mt-3 space-y-1.5 text-xs leading-6 text-zinc-600 dark:text-zinc-300">
          {data.metrics.map((m) => (
            <li key={m.key}>• {m.sentence}</li>
          ))}
        </ul>
      </section>

      {/* 한계·주의 */}
      <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">비교의 한계</h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-6 text-zinc-600 dark:text-zinc-300">
          {data.limitations.map((l) => (
            <li key={l}>· {l}</li>
          ))}
        </ul>
      </section>

      {/* 인터랙티브 비교로 이동 + 다음 확인 */}
      <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">직접 조정하며 비교하기</h2>
          <p className="mt-2 text-xs leading-6 text-zinc-600 dark:text-zinc-300">
            종목을 더하거나 빼며 실시간으로 나란히 보려면 인터랙티브 비교 화면을 이용하세요.
          </p>
          <Link
            href={data.interactiveHref}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            인터랙티브 비교 열기
          </Link>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">다음 확인</h2>
          <div className="mt-3 grid gap-2 text-xs">
            <Link href={`/stock/${data.a.ticker}`} className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              {data.a.name} 상세 보기
            </Link>
            <Link href={`/stock/${data.b.ticker}`} className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              {data.b.name} 상세 보기
            </Link>
            <Link href="/guide/metrics" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              지표 산식 보기
            </Link>
            <Link href="/compare" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              다른 비교 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
