import { CAMPAIGN_SOURCES, campaignSourceOf, type CampaignSource } from "./routeAnalytics";

export const CAMPAIGN_SESSION_STORAGE_KEY = "ornscore_campaign_session_v1";

export type CampaignSessionResolution = {
  campaign?: CampaignSource;
  shouldPersist: boolean;
};

export function isCampaignSource(value: unknown): value is CampaignSource {
  return typeof value === "string" && CAMPAIGN_SOURCES.some((source) => source === value);
}

export function resolveCampaignSession(search: string, remembered: string | null): CampaignSessionResolution {
  const current = campaignSourceOf(new URLSearchParams(search));
  if (current) {
    return { campaign: current, shouldPersist: current !== remembered };
  }

  return {
    campaign: isCampaignSource(remembered) ? remembered : undefined,
    shouldPersist: false,
  };
}

export function campaignContextFromWindow(): CampaignSource | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const remembered = window.sessionStorage.getItem(CAMPAIGN_SESSION_STORAGE_KEY);
    const resolution = resolveCampaignSession(window.location.search, remembered);
    if (resolution.shouldPersist && resolution.campaign) {
      window.sessionStorage.setItem(CAMPAIGN_SESSION_STORAGE_KEY, resolution.campaign);
    } else if (remembered && !isCampaignSource(remembered)) {
      window.sessionStorage.removeItem(CAMPAIGN_SESSION_STORAGE_KEY);
    }
    return resolution.campaign;
  } catch {
    // Storage can be disabled. Campaign attribution must never block the app.
    return campaignSourceOf(new URLSearchParams(window.location.search));
  }
}
