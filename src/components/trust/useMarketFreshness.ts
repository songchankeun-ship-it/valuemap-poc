"use client";

/**
 * 방문 시각(브라우저 KST) 기준으로 시장 데이터 신선도를 계산하는 클라이언트 훅.
 *
 * 신선도는 "지금 사용자가 보는 시점"에 달렸다(예: 금요일 장마감 후 방문 시 목요일 데이터).
 * SSG/빌드 시각으로 굳으면 이 판정이 틀리므로, 마운트 이후 실제 브라우저 시각으로 계산한다.
 * 마운트 전(=서버 렌더 및 첫 클라이언트 렌더)에는 null을 반환해 하이드레이션 불일치를 피한다.
 */
import { useEffect, useState } from "react";
import { computeMarketFreshness, type MarketFreshness } from "@/lib/freshness";

export function useMarketFreshness(asOf: string | undefined): MarketFreshness | null {
  const [freshness, setFreshness] = useState<MarketFreshness | null>(null);
  useEffect(() => {
    setFreshness(computeMarketFreshness(asOf, new Date()));
  }, [asOf]);
  return freshness;
}
