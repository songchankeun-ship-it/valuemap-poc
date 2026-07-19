// /compare — 종목 비교 페이지
import Link from "next/link";
import { realStockPool } from "@/lib/realStocks";
import { compositeOf } from "@/lib/score";
import { isSuspect } from "@/lib/dataQuality";
import { sectorOf } from "@/lib/sector";
import { getRecentSignals } from "@/lib/recentSignals";
import { CompareClient } from "@/components/CompareClient";
import { COMPARE_QUERY_MAX, parseCompareQuery } from "@/lib/compareQuery";
import { metricKeywords, stockDiscoveryKeywords, uniqueKeywords } from "@/lib/seoKeywords";
import { curatedComparisonCards } from "@/lib/comparison";

const compareDescription = "선택한 종목의 PER·PBR·ROE, 배당수익률, 추세, 밸류, 위험조정, 최근 공시 신호를 한눈에 비교합니다.";

// 공시 페이지와 동일하게 최근 신호를 서버에서 추출(라이브 실패 시 샘플 fallback). 30분 캐시.
export const revalidate = 1800;

export const metadata = {
  title: "종목 비교·PER PBR ROE 비교 — 오른스코어",
  description: compareDescription,
  keywords: uniqueKeywords(["종목 비교", "주식 비교", "PER PBR ROE 비교"], metricKeywords, stockDiscoveryKeywords),
  openGraph: {
    title: "종목 비교·PER PBR ROE 비교 — 오른스코어",
    description: compareDescription,
    url: "/compare",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
    images: ["/social/ornscore-og-1200x630.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "종목 비교·PER PBR ROE 비교 — 오른스코어",
    description: compareDescription,
  },
  alternates: { canonical: "/compare" },
};

interface PageProps {
  searchParams: Promise<{ stocks?: string | string[] }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { stocks: stocksParam } = await searchParams;
  const allStocks = realStockPool;

  // 비교용 최소 정보만 직렬화
  const stockMap = Object.fromEntries(
    allStocks.map((s) => [
      s.ticker,
      {
        ticker: s.ticker,
        name: s.name,
        currentPrice: s.currentPrice,
        changePct: s.changePct,
        marketCap: s.marketCap,
        per: s.per,
        pbr: s.pbr,
        roe: s.roe,
        dividendYield: s.dividendYield,
        momentum: s.momentum,
        flow: s.flow,
        value: s.value,
        vol: s.vol,
        neglectScore: s.neglectScore,
        themes: s.themes,
        returns: s.returns ?? {},
      },
    ])
  );

  // 오늘 Top 5 — 홈과 동일 기준(종합점수 상위 · 검증 보류 제외)
  const top5 = [...allStocks]
    .filter((s) => compositeOf(s) > 0 && !isSuspect(s))
    .sort((a, b) => compositeOf(b) - compositeOf(a))
    .slice(0, 5)
    .map((s) => ({ ticker: s.ticker, name: s.name }));

  // 추천 비교 세트 — (1) 큐레이션한 "A vs B" 동종 피어 쌍을 우선 노출하고
  // (2) 같은 업종(sector) 그룹을 중복 업종 제외하고 보충한다. 전부 실데이터만 쓰며,
  // 결측·검증 보류(isSuspect) 종목이 들어간 쌍/그룹은 만들지 않는다(가짜 세트 없음).
  const byTicker = new Map(allStocks.map((s) => [s.ticker, s]));

  // 의미 있는 동종 피어 쌍. 두 종목이 모두 풀에 존재하고 검증 보류가 아닐 때만 노출한다.
  // 첫 방문자에게 항상 보여줄 대표 예시 2쌍은 모두 같은 업종 피어다(반도체 대형주 · 플랫폼).
  // 비교는 순위·후보 산출이 아니라 중립적 나란히 보기(비자문)이고, 검색으로는 이미 어떤 종목이든
  // 담아 비교할 수 있으므로, 이 손수 고른 예시 쌍은 isSuspect(예: 카카오 고PER) 여부와 무관하게
  // 노출한다 — 단 두 종목이 실제로 풀에 있을 때만(가짜 세트 없음).
  // 업종이 다른 교차 프리셋(예: 완성차 vs 금융)은 비교 근거가 약해 예시에서 제외한다(Slice J).
  const NAMED_EXAMPLE_PAIRS: ReadonlyArray<readonly [string, string]> = [
    ["005930", "000660"], // 삼성전자 vs SK하이닉스 (반도체 대형주)
    ["035420", "035720"], // NAVER vs 카카오 (플랫폼)
  ];
  // 그 외 자동 큐레이션 쌍은 검증 보류(isSuspect) 종목이 끼면 자동 제외한다.
  const CURATED_PAIRS: ReadonlyArray<readonly [string, string]> = [
    ["032830", "085620"], // 삼성생명 vs 미래에셋생명 (생명보험)
    ["000990", "042700"], // DB하이텍 vs 한미반도체 (반도체 소부장)
    ["247540", "066970"], // 에코프로비엠 vs 엘앤에프 (2차전지 소재 — 검증 보류면 자동 제외)
  ];
  type PairSet = { label: string; tickers: string[]; names: string[] };
  const buildPair = ([a, b]: readonly [string, string], allowSuspect: boolean): PairSet | null => {
    const sa = byTicker.get(a);
    const sb = byTicker.get(b);
    if (!sa || !sb) return null;
    if (!allowSuspect && (isSuspect(sa) || isSuspect(sb))) return null;
    return {
      label: `${sa.name} vs ${sb.name}`,
      tickers: [sa.ticker, sb.ticker],
      names: [sa.name, sb.name],
    };
  };
  // recommendedSets가 slice(0,4)라, 선두에 고정한 예시 3쌍은 항상 렌더된다.
  const namedSets = NAMED_EXAMPLE_PAIRS.map((p) => buildPair(p, true)).filter((x): x is PairSet => x !== null);
  const curatedSets = CURATED_PAIRS.map((p) => buildPair(p, false)).filter((x): x is PairSet => x !== null);

  // 예시·큐레이션 쌍이 이미 커버한 업종은 보충에서 제외(중복 방지)
  const curatedSectors = new Set(
    [...namedSets, ...curatedSets].flatMap((set) => set.tickers.map((t) => sectorOf(byTicker.get(t)!.themes, t)))
  );

  // 같은 업종(sector) 그룹 — 검증 보류 제외, 큐레이션이 다루지 않은 업종만 보충
  const bySector = new Map<string, typeof allStocks>();
  for (const s of allStocks) {
    if (!(compositeOf(s) > 0) || isSuspect(s)) continue;
    const sector = sectorOf(s.themes, s.ticker);
    if (!sector || sector === "기타" || curatedSectors.has(sector)) continue;
    const arr = bySector.get(sector) ?? [];
    arr.push(s);
    bySector.set(sector, arr);
  }
  const sectorSets = Array.from(bySector.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([sector, arr]) => {
      const picks = [...arr]
        .sort((a, b) => compositeOf(b) - compositeOf(a))
        .slice(0, 4);
      return {
        label: sector,
        tickers: picks.map((s) => s.ticker),
        names: picks.map((s) => s.name),
      };
    })
    // 피어가 가장 많이 모이는(=비교 의미가 큰) 업종 우선
    .sort((a, b) => b.tickers.length - a.tickers.length);

  // 예시 3쌍 고정 선두 + 큐레이션 쌍 + 업종 그룹 보충, 스캔 가능하도록 총 4세트로 제한
  const recommendedSets = [...namedSets, ...curatedSets, ...sectorSets].slice(0, 4);

  // 빈 상태에서 "바로 체험"용 예시 3종목 세트 — 검색을 몰라도 클릭 한 번으로 비교가 채워지도록.
  // 요청 라벨(GS vs SK vs LG · 신한지주 vs KB금융 vs 하나금융)은 고정 표기를 쓰고, 실제 담기는
  // 실데이터 티커로만 한다. 세 티커가 모두 풀에 있을 때만 노출(가짜 세트 없음). "오늘 후보 3개"는
  // 데이터 의존(top5)이라 서버에서 만들지 않고 클라이언트가 top5로 구성한다.
  const EXAMPLE_TRIOS: ReadonlyArray<{ label: string; tickers: readonly [string, string, string] }> = [
    { label: "GS vs SK vs LG", tickers: ["078930", "034730", "003550"] }, // 지주사
    { label: "신한지주 vs KB금융 vs 하나금융", tickers: ["055550", "105560", "086790"] }, // 금융지주
  ];
  const buildTrio = ({ label, tickers }: { label: string; tickers: readonly [string, string, string] }): PairSet | null => {
    const picks = tickers.map((t) => byTicker.get(t));
    if (picks.some((s) => !s)) return null;
    const found = picks as NonNullable<(typeof picks)[number]>[];
    return { label, tickers: found.map((s) => s.ticker), names: found.map((s) => s.name) };
  };
  const exampleSets = EXAMPLE_TRIOS.map(buildTrio).filter((x): x is PairSet => x !== null);
  // 최근 공시 신호(최근 14일) — 비교 종목별 컨텍스트로 노출. 표시 전용(수집·점수 로직 무변경).
  // getRecentSignals는 라이브 DART 실패 시 샘플로 graceful fallback하며, 여기선 풀에 있는 종목만 남긴다.
  const disclosureByTicker: Record<string, Array<{ label: string; type: string; direction?: string; date: string; url: string }>> = {};
  try {
    const recent = await getRecentSignals(14);
    for (const sig of recent.signals) {
      const code = sig.disclosure.stock_code;
      if (!code || !stockMap[code]) continue;
      (disclosureByTicker[code] ??= []).push({
        label: sig.signalLabel,
        type: sig.signalType,
        direction: sig.direction,
        date: sig.disclosure.rcept_dt,
        url: sig.disclosure.url,
      });
    }
    // 종목별 최근순 최대 2건으로 정리(칩 과다 방지)
    for (const code of Object.keys(disclosureByTicker)) {
      disclosureByTicker[code] = disclosureByTicker[code]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 2);
    }
  } catch {
    /* 신호 없으면 비교는 그대로 동작 — graceful */
  }

  const { initialTickers, invalidTickers, truncatedTickers } = parseCompareQuery(
    stocksParam,
    (code) => Boolean(stockMap[code])
  );
  const initialNames = initialTickers.map((ticker) => stockMap[ticker].name);
  // 상한 초과로 잘라낸 종목은 유효 코드이므로 이름으로 안내한다.
  const truncatedNames = truncatedTickers.map((ticker) => stockMap[ticker].name);

  // 큐레이션 비교 랜딩(Slice C) — 서버 렌더 내부 링크. 허용목록 7쌍만, 전부 실데이터.
  const compareCards = curatedComparisonCards();

  return (
    <div className="space-y-4">
      <nav className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        <Link href="/" className="hover:text-zinc-700">홈</Link>
        <span>›</span>
        <span className="text-zinc-900 dark:text-zinc-100">종목 비교</span>
      </nav>

      <header>
        <h1 className="text-xl font-medium mb-1">종목 비교</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          검색하거나 종목 페이지에서 &quot;비교에 추가&quot; 한 종목들을 나란히 봅니다.
          비교 기준은 자체 지표 4종 + 재무 + 수익률이며, 탐색용입니다.
        </p>
        {initialTickers.length >= 2 ? (
          <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            공유 링크에서 불러온 비교: <strong>{initialNames.join(" · ")}</strong>
          </p>
        ) : null}
      </header>

      {invalidTickers.length > 0 ? (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          유효하지 않은 코드는 비교에서 제외했어요: <span className="font-mono">{invalidTickers.join(", ")}</span>
        </div>
      ) : null}

      {truncatedTickers.length > 0 ? (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          비교는 최대 {COMPARE_QUERY_MAX}개까지만 담을 수 있어 뒤쪽 종목은 제외했어요: <strong>{truncatedNames.join(", ")}</strong>
        </div>
      ) : null}

      <CompareClient
        stockMap={stockMap}
        top5={top5}
        recommendedSets={recommendedSets}
        exampleSets={exampleSets}
        disclosureByTicker={disclosureByTicker}
        initialTickers={initialTickers}
      />

      {compareCards.length > 0 ? (
        <section aria-label="추천 비교" className="border-y border-zinc-200 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">바로 보는 종목 비교</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            같은 업종 대표 종목을 미리 정리한 비교 페이지입니다. 어느 쪽이 높고 낮은지 중립적으로 나란히 봅니다.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {compareCards.map((c) => (
              <li key={c.slug} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                <Link
                  href={`/compare/${c.slug}`}
                  className="flex items-center justify-between gap-2 px-1 py-2.5 text-xs transition hover:text-blue-700 dark:hover:text-blue-400"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{c.a.name} vs {c.b.name}</span>
                  <span aria-hidden="true" className="text-zinc-400">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* JS 미실행(정적 렌더·검색엔진·스크립트 오류) 시 빈 화면 방지 fallback.
          단, 유효 종목이 2개 이상이면 CompareClient가 이미 결과를 SSR로 출력하므로
          빈 상태를 함께 렌더하지 않는다(결과 + 빈 상태 동시 노출 방지). */}
      {initialTickers.length < 2 ? (
      <noscript>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 md:p-8 text-center">
          <div className="text-2xl mb-2">📊</div>
          <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">비교할 종목이 아직 없습니다</h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-4">
            종목 탐색에서 직접 찾거나 오늘 후보에서 담아보세요.
            <strong className="text-zinc-700 dark:text-zinc-300"> 최소 2개 · 최대 4개</strong>를 고르면 나란히 비교합니다.
          </p>
          <div className="mb-4 grid gap-1.5 sm:grid-cols-2 max-w-md mx-auto text-left">
            {["종합 점수 차이", "추세/밸류/위험조정 강점 비교", "PER/PBR/ROE 차이", "수익률과 테마 차이", "최근 공시 신호·데이터 점검"].map((item) => (
              <div key={item} className="text-xs text-zinc-600 dark:text-zinc-300">✓ {item}</div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-md mx-auto">
            <a href="/stocks" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold">
              종목 직접 찾기
            </a>
            <a href="/today" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium">
              오늘 후보에서 고르기
            </a>
          </div>
        </div>
      </noscript>
      ) : null}
    </div>
  );
}
