"use client";

import { useEffect } from "react";
import { datasetToAnalyticsProps, trackEvent } from "@/lib/clientAnalytics";

export function AnalyticsEventTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tracked = target.closest<HTMLElement>("[data-analytics-event]");
      if (!tracked) return;
      const eventName = tracked.dataset.analyticsEvent;
      if (!eventName) return;
      trackEvent(eventName, datasetToAnalyticsProps(tracked.dataset));
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
