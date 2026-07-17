import type { MetadataRoute } from "next";
import { realStockPool, dataMetadata } from "@/lib/realStocks";
import { parseDatasetGeneratedAt } from "@/lib/datasetTimestamp";
import { seoTopics } from "@/lib/seoTopics";

const SITE = "https://ornscore.com";

/**
 * lastModified 계약(결정적) — Slice H:
 * 요청/빌드 시각(new Date())을 절대 쓰지 않는다. 값은 오직 로컬 데이터셋에서만
 * 유도한다: 우선 dataMetadata.generatedAt(시간대가 없으면 KST로 해석), 없으면
 * asOfBusinessDate(YYYYMMDD, KST 자정).
 * 같은 데이터 입력이면 항상 같은 sitemap 을 만들어, 크롤러가 매 요청마다 "방금 변경됨"
 * 으로 오인하지 않게 한다. 두 소스 모두 없으면 lastModified 를 생략한다(임의의 현재
 * 시각으로 대체하지 않는다).
 */
function deterministicLastModified(): Date | undefined {
  const iso = dataMetadata?.generatedAt;
  if (iso) {
    const d = parseDatasetGeneratedAt(iso);
    if (d) return d;
  }
  const biz = dataMetadata?.asOfBusinessDate;
  if (biz && /^\d{8}$/.test(biz)) {
    const d = new Date(`${biz.slice(0, 4)}-${biz.slice(4, 6)}-${biz.slice(6, 8)}T00:00:00+09:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

/**
 * 동적 sitemap: 정적 페이지 + 138개 종목 페이지 자동 포함.
 * 구글/네이버가 모든 페이지를 색인할 수 있게 한다.
 * lastModified 는 전 페이지 공통으로 데이터셋 기준의 결정적 값을 쓴다(위 계약 참고).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const dataDate = deterministicLastModified();
  const now = dataDate;

  // 1. 정적 페이지 (공개)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE}/today`,
      lastModified: dataDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE}/stocks`,
      lastModified: dataDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE}/disclosures`,
      lastModified: dataDate,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE}/backtest`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE}/guide/metrics`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/data-deletion`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.25,
    },
  ];

  // 2. 레거시 /theme/* 은퇴(Slice B): 색인 대상이 아니다.
  //    battery·semi-materials·bio·shipbuilding 은 authoritative /topics/* 로 영구
  //    리다이렉트(next.config)되고, robot 은 실데이터 커버리지가 생길 때까지 noindex 다.
  //    따라서 어떤 /theme/* URL 도 sitemap 에 넣지 않는다(모의 종목/집계를 색인 근거로
  //    노출 금지). 색인 대상 테마 의도는 아래 topicPages(실데이터)가 소유한다.
  const topicPages: MetadataRoute.Sitemap = seoTopics.map((topic) => ({
    url: `${SITE}/topics/${topic.slug}`,
    lastModified: dataDate,
    changeFrequency: "weekly" as const,
    priority: 0.62,
  }));

  const stockPages: MetadataRoute.Sitemap = realStockPool.map((s) => ({
    url: `${SITE}/stock/${s.ticker}`,
    lastModified: dataDate,
    changeFrequency: "daily" as const,
    // 시총 큰 종목일수록 우선순위 ↑ (대형 0.8 / 중형 0.7 / 소형 0.6)
    priority: s.marketCap >= 5_000_000_000_000 ? 0.8 : s.marketCap >= 1_000_000_000_000 ? 0.7 : 0.6,
  }));

  return [...staticPages, ...topicPages, ...stockPages];
}
