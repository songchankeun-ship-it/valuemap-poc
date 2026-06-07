"use client";

import { useEffect } from "react";

interface Props {
  ticker: string;
  name: string;
}

interface RecentViewItem {
  ticker: string;
  name: string;
  viewedAt: number;
}

const STORAGE_KEY = "valuemap_recent_views";
const MAX_RECENT = 10;

export function RecentViewTracker({ ticker, name }: Props) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let list: RecentViewItem[] = raw ? JSON.parse(raw) : [];
      list = list.filter((item) => item.ticker !== ticker);
      list.unshift({ ticker, name, viewedAt: Date.now() });
      list = list.slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("recent-views-changed"));
    } catch {}
  }, [ticker, name]);
  return null;
}