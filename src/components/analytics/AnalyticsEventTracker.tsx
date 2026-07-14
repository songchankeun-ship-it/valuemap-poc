"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { datasetToAnalyticsProps, trackEvent } from "@/lib/clientAnalytics";
import { sanitizeClickProps } from "@/lib/clickAnalytics";
import { ROUTE_VIEW_EVENT, classifyRoute } from "@/lib/routeAnalytics";

export function AnalyticsEventTracker() {
  const pathname = usePathname();
  const lastRouteKeyRef = useRef("");

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    const key = `${pathname}${window.location.search}`;
    if (lastRouteKeyRef.current === key) return;
    lastRouteKeyRef.current = key;

    const props = classifyRoute(pathname, window.location.search);
    if (!props) return;
    trackEvent(ROUTE_VIEW_EVENT, props);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tracked = target.closest<HTMLElement>("[data-analytics-event]");
      if (!tracked) return;
      const eventName = tracked.dataset.analyticsEvent;
      if (!eventName) return;
      // Narrow the dataset to the event's fixed, public allow-list before
      // sending, so a stray `data-analytics-*` attribute can never leak.
      const rawProps = datasetToAnalyticsProps(tracked.dataset);
      trackEvent(eventName, sanitizeClickProps(eventName, rawProps));
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
