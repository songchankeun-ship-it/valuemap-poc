import { dataMetadata, isDataStale } from "@/lib/realStocks";
import { dataStatus, dataStatusByLocale, metricsChangelogPath } from "@/lib/dataStatus";
import { getAlertedTickers } from "@/lib/marketAlert";
import { StatusContent } from "@/components/status/StatusContent";

export const metadata = {
  title: "데이터 상태 — 오른스코어",
  description: "오른스코어 데이터 파이프라인의 신선도와 소스 상태를 보여주는 운영 상태 페이지.",
};

export const revalidate = 600;

// asOfBusinessDate(YYYYMMDD) 기준 경과일 계산
function daysSince(yyyymmdd: string | undefined): number | null {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return null;
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const then = new Date(y, m - 1, d).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

export default async function StatusPage() {
  const priceAge = daysSince(dataMetadata.asOfBusinessDate);
  // 헤더·푸터와 동일한 기준(2영업일 이상 경과)으로 지연 판정 — 화면 간 신선도 표기 일치.
  const priceStale = isDataStale(dataMetadata.asOfBusinessDate);
  const alertedCount = (await getAlertedTickers()).size;
  const sc = dataStatus.selfCheck;
  const generatedAt = dataMetadata.generatedAt?.slice(0, 16).replace("T", " ") ?? "—";

  // 다국어 v2: 데이터 파생값(dataStatusByLocale)·서버 계산값을 직렬화 props로 넘기고,
  // 페이지 크롬 번역은 클라이언트 표시부(StatusContent)가 statusCopy에서 읽는다.
  return (
    <StatusContent
      dataStatusByLocale={dataStatusByLocale}
      priceStale={priceStale}
      priceAge={priceAge}
      generatedAt={generatedAt}
      alertedCount={alertedCount}
      metricsChangelogPath={metricsChangelogPath}
      selfCheck={{
        suspectCount: sc.suspectCount,
        missingFinancialsCount: sc.missingFinancialsCount,
        universeCount: sc.universeCount,
        metricsVersionMatch: sc.metricsVersionMatch,
        expectedMetricsVersion: sc.expectedMetricsVersion,
      }}
    />
  );
}
