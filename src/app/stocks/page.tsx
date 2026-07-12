import type { Metadata } from "next";
import { realStockPool, allThemes, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";
import { getPriceLagSummary } from "@/lib/priceLag";
import { StocksExplorer } from "@/components/StocksExplorer";
import { CompareTray } from "@/components/stock/CompareTray";
import { TopicLandingLinks } from "@/components/seo/TopicLandingLinks";
import { metricKeywords, stockDiscoveryKeywords, themeKeywords, uniqueKeywords } from "@/lib/seoKeywords";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ theme?: string; sector?: string; q?: string }>;
}

function allSectors() {
  return Array.from(new Set(realStockPool.map((s) => sectorOf(s.themes, s.ticker)))).sort((a, b) => a.localeCompare(b, "ko"));
}

// SSR 시점에 필터 조합의 결과 건수를 서버에서 계산한다. StocksExplorer 의 matchesConfig 중
// theme/sector/q 세 축과 동일한 의미(이름·티커 부분일치, 테마 포함, 업종 일치)만 반영한다.
// 0건 조합을 색인 대상에서 제외(noindex)하기 위한 판정에만 쓰이고, 실제 필터링/점수는 건드리지 않는다.
function serverResultCount({ theme, sector, q }: { theme?: string; sector?: string; q?: string }): number {
  const ql = q ? q.toLowerCase() : "";
  return realStockPool.filter((s) => {
    if (ql && !s.name.toLowerCase().includes(ql) && !s.ticker.includes(ql)) return false;
    if (theme && !s.themes.includes(theme)) return false;
    if (sector && sectorOf(s.themes, s.ticker) !== sector) return false;
    return true;
  }).length;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const { theme, sector, q } = sp;
  const themes = allThemes();
  const sectors = allSectors();
  const validSector = sector && sectors.includes(sector) ? sector : undefined;
  const legacySector = theme && !themes.includes(theme) && sectors.includes(theme) ? theme : undefined;
  const selectedSector = validSector ?? legacySector;
  const validTheme = theme && themes.includes(theme) ? theme : undefined;
  // theme 파라미터가 테마도 업종도 아니면(오타·존재하지 않는 조합) 그대로 필터에 넘겨 0건이 되고,
  // 아래 conservativeIndex 로 noindex 처리된다.
  const unresolvedTheme = theme && !themes.includes(theme) && !legacySector ? theme : undefined;
  const effectiveTheme = validTheme ?? unresolvedTheme;
  const queryStr = typeof q === "string" && q.trim() ? q.trim() : undefined;

  // 색인 안전장치: 아래 조합은 무한한 저품질 URL 공간을 만들 수 있어 noindex + canonical=/stocks 로 축소한다.
  //   (a) 결과 0건 조합(존재하지 않는 테마/업종/검색어), (b) 자유 검색어(q, 무한 조합),
  //   (c) 필터 축이 2개 이상 겹친 URL, (d) 인식하지 못하는 파라미터를 포함한 과다 파라미터 URL.
  // 기본 /stocks 와 "단일 업종" 또는 "단일 테마"(결과 존재) 페이지만 색인 대상으로 유지한다.
  const activeParamKeys = Object.keys(sp).filter((k) => {
    const v = (sp as Record<string, unknown>)[k];
    return typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v != null;
  });
  const effectiveDims = [effectiveTheme, selectedSector, queryStr].filter(Boolean).length;
  const resultCount = serverResultCount({ theme: effectiveTheme, sector: selectedSector, q: queryStr });
  const conservativeIndex =
    resultCount === 0 || !!queryStr || effectiveDims > 1 || activeParamKeys.length > 1;

  const indexableRobots = { index: true, follow: true } as const;
  const noindexRobots = { index: false, follow: true } as const;

  if (selectedSector) {
    const sectorTitle = `${selectedSector} 업종 종목 분석 — 오른스코어`;
    const sectorDescription = `${selectedSector} 업종 종목을 주식 스크리닝 기준으로 정렬·필터링합니다. PER·PBR·ROE, 배당수익률, 추세·거래활성도·밸류·위험조정을 함께 비교하세요.`;
    const canonicalUrl = `/stocks?sector=${encodeURIComponent(selectedSector)}`;
    return {
      title: sectorTitle,
      description: sectorDescription,
      keywords: uniqueKeywords([`${selectedSector} 업종`, `${selectedSector} 종목`, `${selectedSector} 주식`], stockDiscoveryKeywords, metricKeywords),
      openGraph: {
        title: sectorTitle,
        description: sectorDescription,
        url: canonicalUrl,
        siteName: "오른스코어",
        locale: "ko_KR",
        type: "website",
        images: ["/social/ornscore-og-1200x630.jpg"],
      },
      twitter: {
        card: "summary_large_image",
        title: sectorTitle,
        description: sectorDescription,
      },
      robots: conservativeIndex ? noindexRobots : indexableRobots,
      // 색인 대상 단일 업종 페이지는 자기 참조 canonical 로 정규화하고, 축소 대상 조합은 /stocks 로 되돌린다.
      // (레거시 ?theme=업종명 URL 도 정규 ?sector=업종명 로 통합된다.)
      alternates: { canonical: conservativeIndex ? "/stocks" : canonicalUrl },
    };
  }
  if (effectiveTheme) {
    const themedTitle = `${effectiveTheme} 관련주 테마 종목 — 오른스코어`;
    const themedDescription = `${effectiveTheme} 관련주와 테마주를 주식 스크리닝 기준으로 살펴봅니다. PER·PBR·ROE, 배당수익률, 추세·거래활성도·밸류·위험조정을 함께 비교하세요.`;
    const canonicalUrl = `/stocks?theme=${encodeURIComponent(effectiveTheme)}`;
    return {
      title: themedTitle,
      description: themedDescription,
      keywords: uniqueKeywords(themeKeywords("", effectiveTheme), stockDiscoveryKeywords, metricKeywords),
      openGraph: {
        title: themedTitle,
        description: themedDescription,
        url: canonicalUrl,
        siteName: "오른스코어",
        locale: "ko_KR",
        type: "website",
        // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
        images: ["/social/ornscore-og-1200x630.jpg"],
      },
      twitter: {
        card: "summary_large_image",
        title: themedTitle,
        description: themedDescription,
      },
      robots: conservativeIndex ? noindexRobots : indexableRobots,
      // 색인 대상 단일 테마 페이지만 자기 참조 canonical, 0건/과다 파라미터 조합은 /stocks 로 정규화.
      alternates: { canonical: conservativeIndex ? "/stocks" : canonicalUrl },
    };
  }
  const title = "주식 스크리닝·종목 검색 — 오른스코어";
  const description = `${dataMetadata.count}개 코스피·코스닥 종목을 검색하고 정렬합니다. PER·PBR·ROE, 배당수익률, 저평가, 추세, 거래활성도, 위험조정 지표로 종목을 좁혀보세요.`;
  return {
    title,
    description,
    keywords: uniqueKeywords(stockDiscoveryKeywords, metricKeywords),
    openGraph: {
      title,
      description,
      url: "/stocks",
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
    // 필터 없는 기본 /stocks 는 색인 대상. q 검색·과다 파라미터가 붙으면 noindex 로 축소한다.
    robots: conservativeIndex ? noindexRobots : indexableRobots,
    alternates: { canonical: "/stocks" },
  };
}

export default async function StocksPage({ searchParams }: PageProps) {
  const { theme, sector, q } = await searchParams;
  const stocks = realStockPool.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    currentPrice: s.currentPrice,
    changePct: s.changePct,
    marketCap: s.marketCap,
    market: s.market ?? "KOSPI",
    dividendYield: s.dividendYield ?? 0,
    eps: s.eps ?? 0,
    per: s.per,
    pbr: s.pbr,
    roe: s.roe,
    momentum: s.momentum,
    flow: s.flow,
    value: s.value,
    vol: s.vol,
    compositeScore: s.compositeScore,
    themes: s.themes,
    sector: sectorOf(s.themes, s.ticker),
    r3m: typeof s.returns?.r3m === "number" ? s.returns.r3m : null,
  }));
  const themes = allThemes();
  const sectors = allSectors();
  const validSector = sector && sectors.includes(sector) ? sector : undefined;
  const legacySector = theme && !themes.includes(theme) && sectors.includes(theme) ? theme : undefined;
  const initialSector = validSector ?? legacySector;
  const unresolvedTheme = theme && !themes.includes(theme) && !legacySector && !initialSector ? theme : undefined;
  const initialThemes = theme && themes.includes(theme) ? [theme] : unresolvedTheme ? [unresolvedTheme] : [];
  const laggedTickers = getPriceLagSummary().laggedTickers;
  return (
    <>
      <StocksExplorer
        stocks={stocks}
        allThemes={themes}
        initialThemes={initialThemes}
        initialSector={initialSector}
        initialQuery={typeof q === "string" ? q : ""}
        totalCount={stocks.length}
        asOf={formatBizDateLong(dataMetadata.asOfBusinessDate)}
        metricsVersion={dataMetadata.metricsVersion}
        dataStale={isDataStale(dataMetadata.asOfBusinessDate)}
        laggedTickers={laggedTickers}
      />
      <TopicLandingLinks />
      {/* 설계서 §8-3·§12-5: 발견에서 담은 종목을 비교함 N/4로 이어가는 트레이. 담기는 각 카드가
          소유하고, 트레이는 담긴 수 반영 + /compare 이동만 담당(count 0이면 자동 숨김). */}
      <CompareTray />
    </>
  );
}
