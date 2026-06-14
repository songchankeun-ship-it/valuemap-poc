"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Trash2 } from "lucide-react";
import { listConditionAlerts, removeConditionAlert, setConditionAlertActive, type ConditionAlert } from "@/lib/conditionAlerts";
import type { SavedSearchConfig } from "@/lib/savedSearches";

const CAP_LABEL: Record<string, string> = { large: "대형주", mid: "중형주", small: "소형주" };

function summarize(c: SavedSearchConfig): string {
  const parts: string[] = [];
  if (c.minComposite) parts.push(`종합 ${c.minComposite}+`);
  if (c.perMax !== undefined && c.perMax < 200) parts.push(`PER ≤${c.perMax}`);
  if (c.pbrMax !== undefined && c.pbrMax < 30) parts.push(`PBR ≤${c.pbrMax}`);
  if (c.roeMin) parts.push(`ROE ${c.roeMin}%+`);
  if (c.divYieldMin) parts.push(`배당 ${c.divYieldMin}%+`);
  if (c.capBucket && c.capBucket !== "all") parts.push(CAP_LABEL[c.capBucket] ?? c.capBucket);
  if (c.market && c.market !== "all") parts.push(c.market);
  if (c.excludeLoss) parts.push("적자 제외");
  if (c.themes && c.themes.length) parts.push(c.themes.join("·"));
  return parts.length ? parts.join(" · ") : "전체 종목";
}

export function ConditionAlertsManager() {
  const [alerts, setAlerts] = useState<ConditionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listConditionAlerts().then((r) => {
      setAlerts(r);
      setLoading(false);
    });
  }, []);

  async function toggle(id: string, active: boolean) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
    await setConditionAlertActive(id, active);
  }
  async function remove(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await removeConditionAlert(id);
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">조건 충족 알림</h2>
      </div>
      <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        종목 탐색에서 저장한 조건에 <strong>새 종목이 들어오면</strong> 이메일로 알려드려요. (영업일 1회 평가)
      </p>

      {loading ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          아직 등록한 조건 알림이 없어요. <Link href="/stocks" className="text-blue-600 dark:text-blue-400 underline">종목 탐색</Link>에서 원하는 필터를 맞춘 뒤 <strong>“🔔 이 조건 알림”</strong>을 눌러보세요.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{a.name}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{summarize(a.config)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggle(a.id, !a.active)}
                  className={"text-[11px] px-2 py-1 rounded-full border transition " + (a.active ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500")}
                >
                  {a.active ? "켜짐" : "꺼짐"}
                </button>
                <button type="button" onClick={() => remove(a.id)} aria-label="삭제" className="p-1.5 text-zinc-400 hover:text-rose-600 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
