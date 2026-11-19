"use client";

import { track } from "@vercel/analytics";
import { campaignContextFromWindow } from "./campaignSession";
import { GROWTH_ENDPOINT, projectGrowthEvent } from "./growthAggregate";

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsProps = Record<string, AnalyticsValue>;

const MAX_STRING_LENGTH = 96;

function cleanValue(value: AnalyticsValue): AnalyticsValue {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > MAX_STRING_LENGTH ? `${trimmed.slice(0, MAX_STRING_LENGTH - 1)}…` : trimmed;
}

export function trackEvent(name: string, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  let cleanProps: AnalyticsProps;
  try {
    cleanProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      cleanProps[key] = cleanValue(value);
    }
    const campaign = campaignContextFromWindow();
    if (campaign && cleanProps.campaign === undefined) {
      cleanProps.campaign = campaign;
    }
  } catch {
    return;
  }
  try {
    track(name, cleanProps);
  } catch {
    // Keep the aggregate path independent of the existing tracker.
  }
  try {
    if (document.body.dataset.growthAggregate !== "enabled") return;
    const payload = projectGrowthEvent(window.location.pathname, name, cleanProps);
    if (!payload) return;
    void fetch(GROWTH_ENDPOINT, {
      method: "POST",
      mode: "same-origin",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Analytics must never break navigation or product actions.
  }
}

export function datasetToAnalyticsProps(dataset: DOMStringMap): AnalyticsProps {
  const props: AnalyticsProps = {};
  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith("analytics") || key === "analyticsEvent") continue;
    const rawName = key.slice("analytics".length);
    if (!rawName) continue;
    const propName = rawName.charAt(0).toLowerCase() + rawName.slice(1);
    props[propName] = value ?? "";
  }
  return props;
}
