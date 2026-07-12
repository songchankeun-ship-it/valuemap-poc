"use client";

import { track } from "@vercel/analytics";

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
  try {
    const cleanProps: AnalyticsProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      cleanProps[key] = cleanValue(value);
    }
    track(name, cleanProps);
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
