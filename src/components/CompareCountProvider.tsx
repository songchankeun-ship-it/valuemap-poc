"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCompareList } from "@/lib/compare";

const CompareCount = createContext(0);
const CHANGE_EVENTS = ["compare-basket-changed", "ornscore:compare-updated", "valuemap:compare-updated"];

export function useCompareCount() {
  return useContext(CompareCount);
}

export function CompareCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    let scheduled = false;
    let revision = 0;

    function update() {
      const request = ++revision;
      void getCompareList().then((list) => {
        if (active && request === revision) setCount(list.length);
      }).catch(() => { /* Keep the last known count on a failed read. */ });
    }

    // A write publishes all legacy events together; read the basket only once.
    function scheduleUpdate() {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        if (active) update();
      });
    }

    update();
    for (const event of CHANGE_EVENTS) window.addEventListener(event, scheduleUpdate);
    return () => {
      active = false;
      for (const event of CHANGE_EVENTS) window.removeEventListener(event, scheduleUpdate);
    };
  }, []);

  return <CompareCount.Provider value={count}>{children}</CompareCount.Provider>;
}
