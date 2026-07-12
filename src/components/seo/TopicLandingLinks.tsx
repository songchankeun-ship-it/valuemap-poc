import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { featuredSeoTopics } from "@/lib/seoTopics";

export function TopicLandingLinks() {
  const topics = featuredSeoTopics();

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8" aria-labelledby="topic-search-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="topic-search-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            검색어별 종목 탐색
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            자주 찾는 조건을 별도 화면으로 정리했습니다. 각 화면은 후보를 좁히는 출발점이며 투자 추천이 아닙니다.
          </p>
        </div>
        <Link
          href="/guide/metrics"
          className="hidden min-h-10 items-center gap-1 rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-400 sm:inline-flex"
        >
          지표 기준
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}`}
            data-analytics-event="topic_link_click"
            data-analytics-source="stocks_topic_links"
            data-analytics-topic={topic.slug}
            className="group min-h-[86px] rounded-md border border-zinc-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
          >
            <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-400">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="block text-[12px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
              {topic.shortLabel}
            </span>
            <span className="mt-1 block text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
              {topic.primaryMetric} 기준
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
