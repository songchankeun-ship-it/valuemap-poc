// GET /api/cron/evaluate-alerts — 저장된 '조건 알림'을 현재 종목 데이터로 평가해
// 새로 조건을 충족한 종목이 생기면 이메일로 알린다.
// vercel.json cron 등록 필요. CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY 필요.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { realStockPool } from "@/lib/realStocks";
import { compositeOf } from "@/lib/score";
import { matchesConfig, type StockForMatch } from "@/lib/matchConfig";
import type { SavedSearchConfig } from "@/lib/savedSearches";

export const runtime = "nodejs";
export const maxDuration = 60;

async function sendEmailViaResend(params: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "오른스코어 <noreply@ornscore.com>",
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function renderAlertEmail(alertName: string, matched: StockForMatch[]): string {
  const rows = matched
    .map(
      (s) => `
      <div style="margin-bottom: 10px; padding: 12px 14px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <div style="font-size: 11px; color: #a1a1aa; font-family: monospace;">${s.ticker}</div>
        <a href="https://www.ornscore.com/stock/${s.ticker}" style="font-size: 15px; font-weight: 700; color: #18181b; text-decoration: none;">${s.name} →</a>
        <div style="font-size: 12px; color: #52525b; margin-top: 4px;">종합 ${s.score} · PER ${s.per > 0 ? s.per.toFixed(1) : "—"} · ROE ${s.roe ? s.roe.toFixed(1) + "%" : "—"}</div>
      </div>`
    )
    .join("");
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; line-height: 1.6;">
    <div style="display:inline-flex; align-items:center; gap:8px; margin-bottom:20px;">
      <span style="display:inline-block; width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; text-align:center; line-height:28px; font-weight:700;">V</span>
      <span style="font-size:16px; font-weight:600;">오른스코어</span>
    </div>
    <h1 style="font-size:20px; font-weight:700; margin:0 0 8px;">'${alertName}' 조건에 새 종목 ${matched.length}곳</h1>
    <p style="font-size:14px; color:#52525b; margin:0 0 20px;">저장하신 조건을 새로 충족한 종목이에요. 자체 지표는 탐색 우선순위용 실험 지표입니다.</p>
    ${rows}
    <div style="margin-top:24px; padding-top:20px; border-top:1px solid #e4e4e7; font-size:12px; color:#71717a;">
      <p style="margin:0 0 8px;">알림은 <a href="https://www.ornscore.com/settings/notifications" style="color:#3f3f46;">알림 설정</a>에서 끌 수 있어요.</p>
      <p style="margin:0; color:#a1a1aa;">ⓒ 오른스코어 · 투자 권유가 아닙니다.</p>
    </div>
  </div>`;
}

interface AlertRow {
  id: string;
  user_id: string;
  name: string;
  config: SavedSearchConfig;
  last_match: string[] | null;
  active: boolean;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "dev-only"}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: alerts, error } = await supabase
      .from("condition_alerts")
      .select("id, user_id, name, config, last_match, active")
      .eq("active", true);
    if (error) return NextResponse.json({ error: "fetch alerts failed" }, { status: 500 });
    if (!alerts || alerts.length === 0) return NextResponse.json({ message: "no active alerts", notified: 0 });

    const userIds = Array.from(new Set(alerts.map((a) => a.user_id)));
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, enabled")
      .in("user_id", userIds);
    const optedOut = new Set((prefs ?? []).filter((p) => !p.enabled).map((p) => p.user_id));

    const pool: StockForMatch[] = realStockPool.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      per: s.per,
      pbr: s.pbr,
      roe: s.roe,
      dividendYield: s.dividendYield ?? 0,
      eps: s.eps ?? 0,
      score: Math.round(compositeOf(s)),
      marketCap: s.marketCap,
      market: s.market ?? "KOSPI",
      themes: s.themes,
    }));

    const results: Array<{ id: string; sent?: number; error?: string }> = [];

    for (const a of alerts as AlertRow[]) {
      const matched = pool.filter((s) => matchesConfig(s, a.config));
      const matchedTickers = matched.map((s) => s.ticker);
      const prev = new Set((a.last_match ?? []) as string[]);
      const fresh = matched.filter((s) => !prev.has(s.ticker));

      if (fresh.length === 0 || optedOut.has(a.user_id)) {
        await supabase.from("condition_alerts").update({ last_match: matchedTickers }).eq("id", a.id);
        continue;
      }

      const { data: userData } = await supabase.auth.admin.getUserById(a.user_id);
      const email = userData?.user?.email;
      if (!email) {
        await supabase.from("condition_alerts").update({ last_match: matchedTickers }).eq("id", a.id);
        continue;
      }

      const send = await sendEmailViaResend({
        to: email,
        subject: `[오른스코어] '${a.name}' 조건에 새 종목 ${fresh.length}곳`,
        html: renderAlertEmail(a.name, fresh.slice(0, 20)),
      });
      if (send.ok) {
        await supabase
          .from("condition_alerts")
          .update({ last_match: matchedTickers, last_notified_at: new Date().toISOString() })
          .eq("id", a.id);
        results.push({ id: a.id, sent: fresh.length });
      } else {
        results.push({ id: a.id, error: send.error });
      }
    }

    return NextResponse.json({
      success: true,
      alerts: alerts.length,
      notified: results.filter((r) => r.sent).length,
      results,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
