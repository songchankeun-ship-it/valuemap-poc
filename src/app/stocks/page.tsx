import type { Metadata } from "next";
import { realStockPool, allThemes, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";
import { StocksExplorer } from "@/components/StocksExplorer";
import { CompareTray } from "@/components/stock/CompareTray";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ theme?: string; sector?: string; q?: string }>;
}

function allSectors() {
  return Array.from(new Set(realStockPool.map((s) => sectorOf(s.themes)))).sort((a, b) => a.localeCompare(b, "ko"));
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { theme, sector } = await searchParams;
  const themes = allThemes();
  const sectors = allSectors();
  const validSector = sector && sectors.includes(sector) ? sector : undefined;
  const legacySector = theme && !themes.includes(theme) && sectors.includes(theme) ? theme : undefined;
  const selectedSector = validSector ?? legacySector;
  if (selectedSector) {
    const sectorTitle = `${selectedSector} 업종 종목 — 오른스코어`;
    const sectorDescription = `${selectedSector} 업종 종목을 자체 지표 4종(추세·거래활성도·밸류·위험조정)으로 정렬·필터링합니다.`;
    return {
      title: sectorTitle,
      description: sectorDescription,
      openGraph: {
        title: sectorTitle,
        description: sectorDescription,
        url: `/stocks?sector=${encodeURIComponent(selectedSector)}`,
        siteName: "오른스코어",
        locale: "ko_KR",
        type: "website",
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title: sectorTitle,
        description: sectorDescription,
      },
    };
  }
  if (theme) {
    const themedTitle = `${theme} 관련 종목 — 오른스코어`;
    const themedDescription = `${theme} 테마 종목을 자체 지표 4종(추세·거래활성도·밸류·위험조정)으로 정렬·필터링합니다.`;
    // 테마별 URL 은 canonical 을 지정하지 않아 중복 URL 정규화를 피하고,
    // 기본(?theme 없음) URL 만 색인 대상 canonical 로 둔다.
    return {
      title: themedTitle,
      description: themedDescription,
      openGraph: {
        title: themedTitle,
        description: themedDescription,
        url: `/stocks?theme=${encodeURIComponent(theme)}`,
        siteName: "오른스코어",
        locale: "ko_KR",
        type: "website",
        // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title: themedTitle,
        description: themedDescription,
      },
    };
  }
  const title = "종목 탐색 — 오른스코어";
  const description = `${dataMetadata.count}개 종목을 자체 지표 4종으로 정렬·필터링`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/stocks",
      siteName: "오른스코어",
      locale: "ko_KR",
      type: "website",
      // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
    sector: sectorOf(s.themes),
    r3m: typeof s.returns?.r3m === "number" ? s.returns.r3m : null,
  }));
  const themes = allThemes();
  const sectors = allSectors();
  const validSector = sector && sectors.includes(sector) ? sector : undefined;
  const legacySector = theme && !themes.includes(theme) && sectors.includes(theme) ? theme : undefined;
  const initialSector = validSector ?? legacySector;
  const unresolvedTheme = theme && !themes.includes(theme) && !legacySector && !initialSector ? theme : undefined;
  const initialThemes = theme && themes.includes(theme) ? [theme] : unresolvedTheme ? [unresolvedTheme] : [];
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
      />
      {/* 설계서 §8-3·§12-5: 발견에서 담은 종목을 비교함 N/4로 이어가는 트레이. 담기는 각 카드가
          소유하고, 트레이는 담긴 수 반영 + /compare 이동만 담당(count 0이면 자동 숨김). */}
      <CompareTray />
    </>
  );
}
