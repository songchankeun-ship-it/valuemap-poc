import type { MetadataRoute } from "next";
import { realStockPool, dataMetadata } from "@/lib/realStocks";

const SITE = "https://valuemap.kr";

/**
 * 동적 sitemap: 정적 페이지 + 138개 종목 페이지 자동 포함.
 * 구글/네이버가 모든 페이지를 색인할 수 있게 한다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 데이터 마지막 업데이트 시각 (있으면 사용)
  let dataDate = now;
  try {
    const iso = dataMetadata?.generatedAt;
    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) dataDate = d;
    }
  } catch {
    // ignore
  }

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
      url: `${SITE}/guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
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
  ];

  // 2. 종목 페이지 (138개)
  const stockPages: MetadataRoute.Sitemap = realStockPool.map((s) => ({
    url: `${SITE}/stock/${s.ticker}`,
    lastModified: dataDate,
    changeFrequency: "daily" as const,
    // 시총 큰 종목일수록 우선순위 약간 더 ↑
    priority: 0.7,
  }));

  return [...staticPages, ...stockPages];
}
