"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { datasetToAnalyticsProps, trackEvent } from "@/lib/clientAnalytics";

type RouteAnalyticsProps = {
  routeKind: string;
  ticker?: string;
  topic?: string;
  hasQuery?: boolean;
  hasFilters?: boolean;
  compareCount?: number;
};

function routeAnalyticsProps(pathname: string, search: string): RouteAnalyticsProps | null {
  if (pathname.startsWith("/admin")) return null;

  const parts = pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(search);

  if (pathname === "/") return { routeKind: "home" };
  if (pathname === "/stocks") {
    return {
      routeKind: "stocks",
      hasQuery: params.has("q"),
      hasFilters: params.has("sector") || params.has("themes") || params.has("market") || params.has("sort"),
    };
  }
  if (parts[0] === "stock" && parts[1]) return { routeKind: "stock_detail", ticker: parts[1] };
  if (parts[0] === "topics" && parts[1]) return { routeKind: "topic", topic: parts[1] };
  if (pathname === "/compare") {
    const compareCount = (params.get("stocks") ?? "").split(",").filter(Boolean).length;
    return { routeKind: "compare", compareCount };
  }
  if (pathname === "/watchlist") return { routeKind: "watchlist" };
  if (pathname === "/today") return { routeKind: "today" };
  if (pathname === "/disclosures") return { routeKind: "disclosures" };
  if (pathname === "/backtest") return { routeKind: "backtest" };
  if (pathname === "/guide/metrics") return { routeKind: "metrics_guide" };
  if (pathname === "/login") return { routeKind: "login", hasQuery: params.has("next") || params.has("error") };
  if (pathname === "/pricing") return { routeKind: "pricing" };
  if (pathname === "/about") return { routeKind: "about" };
  if (pathname === "/status") return { routeKind: "status" };

  return { routeKind: "other_public" };
}

export function AnalyticsEventTracker() {
  const pathname = usePathname();
  const lastRouteKeyRef = useRef("");

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    const key = `${pathname}${window.location.search}`;
    if (lastRouteKeyRef.current === key) return;
    lastRouteKeyRef.current = key;

    const props = routeAnalyticsProps(pathname, window.location.search);
    if (!props) return;
    trackEvent("route_view_public", props);
  }, [pathname]);

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
