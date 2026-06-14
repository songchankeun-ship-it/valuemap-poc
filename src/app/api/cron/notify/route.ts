// GET /api/cron/notify — 관심 종목 공시 신호 알림 발송
// vercel.json: { "path": "/api/cron/notify", "schedule": "30 7 * * *" }  (UTC 07:30 = KST 16:30, 장 마감 후)
//
// CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY 환경변수 필요.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecentSignals } from "@/lib/recentSignals";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Disclosure {
  corp_name: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
  url: string;
}

interface Signal {
  signalType: string;
  signalLabel: string;
  strength: number;
  disclosure: Disclosure;
}

interface SignalsFile {
  signals: Signal[];
}

async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "오른스코어 <noreply@ornscore.com>",
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const SIGNAL_STYLES: Record<string, { bg: string; color: string }> = {
  treasury_buy: { bg: "#dcfce7", color: "#166534" },
  insider_buy: { bg: "#dbeafe", color: "#1e40af" },
  correction: { bg: "#fef3c7", color: "#92400e" },
  single_contract: { bg: "#e0f2fe", color: "#0369a1" },
  capital_raise: { bg: "#fce7f3", color: "#9d174d" },
};

function renderEmail(signals: Signal[]): string {
  const byTicker = new Map<string, Signal[]>();
  for (const s of signals) {
    const key = s.disclosure.stock_code;
    if (!byTicker.has(key)) byTicker.set(key, []);
    byTicker.get(key)!.push(s);
  }

  let sectionsHtml = "";
  for (const [stockCode, sigs] of byTicker.entries()) {
    const corpName = sigs[0].disclosure.corp_name;

    const signalListHtml = sigs
      .map((s) => {
        const style = SIGNAL_STYLES[s.signalType] || { bg: "#e4e4e7", color: "#52525b" };
        return `
        <div style="padding: 10px 0; border-bottom: 1px solid #f4f4f5;">
          <div>
            <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${style.bg}; color: ${style.color};">${s.signalLabel}</span>
            <span style="font-size: 11px; color: #71717a; margin-left: 8px;">분류 신뢰도 ${s.strength}%</span>
          </div>
          <div style="font-size: 12px; color: #3f3f46; margin-top: 6px; line-height: 1.5;">${s.disclosure.report_nm}</div>
          <a href="${s.disclosure.url}" style="display: inline-block; margin-top: 4px; font-size: 11px; color: #3b82f6; text-decoration: none;">DART 원문 보기 →</a>
        </div>`;
      })
      .join("");

    sectionsHtml += `
      <div style="margin-bottom: 16px; padding: 14px 16px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <div style="font-size: 11px; color: #a1a1aa; font-family: monospace; margin-bottom: 2px;">${stockCode}</div>
        <a href="https://www.ornscore.com/stock/${stockCode}" style="display: inline-block; font-size: 16px; font-weight: 700; color: #18181b; text-decoration: none;">${corpName} →</a>
        <div style="margin-top: 8px;">${signalListHtml}</div>
      </div>`;
  }

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; line-height: 1.6;">
  <div style="margin-bottom: 24px;">
    <div style="display: inline-flex; align-items: center; gap: 8px;">
      <span style="display: inline-block; width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">V</span>
      <span style="font-size: 16px; font-weight: 600;">오른스코어</span>
    </div>
  </div>
  <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">관심 종목 새 공시 신호 ${signals.length}건</h1>
  <p style="font-size: 14px; color: #52525b; margin: 0 0 24px;">회원님의 관심 종목에서 새로운 DART 공시 신호가 발견됐어요.</p>
  ${sectionsHtml}
  <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a;">
    <p style="margin: 0 0 8px;">알림이 너무 많거나 받고 싶지 않으면 <a href="https://www.ornscore.com/settings/notifications" style="color: #3f3f46;">알림 설정</a>에서 끌 수 있어요.</p>
    <p style="margin: 0; color: #a1a1aa;">ⓒ 오른스코어 · 본 분석은 투자 권유가 아닙니다. 원문 확인 권장.</p>
  </div>
</div>`;
}

export async function GET(req: Request) {
  // Cron 인증
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "dev-only"}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. 라이브 DART에서 최근 신호 추출 (실패 시 getRecentSignals 내부에서 샘플 fallback)
    const data = await getRecentSignals(7);
    const signals = ((data.signals ?? []) as unknown as Signal[]).filter((s) => s.disclosure?.stock_code && s.disclosure?.rcept_no);

    if (signals.length === 0) {
      return NextResponse.json({ message: "No signals to notify", sent: 0 });
    }

    const signalTickers = new Set(signals.map((s) => s.disclosure.stock_code));

    // 2. Supabase admin client
    const supabase = createAdminClient();

    // 3. 매칭되는 watchlists 조회
    const { data: watchlists, error: wlError } = await supabase
      .from("watchlists")
      .select("user_id, ticker")
      .in("ticker", Array.from(signalTickers));

    if (wlError) {
      console.error("watchlists fetch error:", wlError);
      return NextResponse.json({ error: "Failed to fetch watchlists" }, { status: 500 });
    }

    if (!watchlists || watchlists.length === 0) {
      return NextResponse.json({ message: "No matching watchlists", sent: 0 });
    }

    // 4. 사용자별 ticker 그룹화
    const userTickers = new Map<string, Set<string>>();
    for (const w of watchlists) {
      if (!userTickers.has(w.user_id)) userTickers.set(w.user_id, new Set());
      userTickers.get(w.user_id)!.add(w.ticker);
    }

    // 5. 알림 OFF 사용자 제외
    const userIds = Array.from(userTickers.keys());
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, enabled")
      .in("user_id", userIds);
    const optedOut = new Set((prefs ?? []).filter((p) => !p.enabled).map((p) => p.user_id));

    // 6. 사용자별 발송
    const results: Array<{ userId: string; email: string; sent: number; error?: string }> = [];

    for (const [userId, tickers] of userTickers.entries()) {
      if (optedOut.has(userId)) continue;

      const relevantSignals = signals.filter((s) => tickers.has(s.disclosure.stock_code));
      if (relevantSignals.length === 0) continue;

      // 이미 발송한 신호 제외 (중복 방지)
      const rceptNos = relevantSignals.map((s) => s.disclosure.rcept_no);
      const { data: existing } = await supabase
        .from("notification_log")
        .select("disclosure_id")
        .eq("user_id", userId)
        .in("disclosure_id", rceptNos);
      const sentSet = new Set((existing ?? []).map((r) => r.disclosure_id));

      const toSend = relevantSignals.filter((s) => !sentSet.has(s.disclosure.rcept_no));
      if (toSend.length === 0) continue;

      // 사용자 이메일 조회
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (!email) continue;

      // 이메일 발송
      const html = renderEmail(toSend);
      const subject = `[오른스코어] 관심 종목 새 공시 신호 ${toSend.length}건`;
      const sendResult = await sendEmailViaResend({ to: email, subject, html });

      if (sendResult.ok) {
        // notification_log 기록 (중복 방지용)
        const logs = toSend.map((s) => ({
          user_id: userId,
          ticker: s.disclosure.stock_code,
          disclosure_id: s.disclosure.rcept_no,
          signal_type: s.signalType,
          signal_label: s.signalLabel,
        }));
        await supabase.from("notification_log").insert(logs);
        results.push({ userId, email, sent: toSend.length });
      } else {
        results.push({ userId, email, sent: 0, error: sendResult.error });
      }
    }

    return NextResponse.json({
      success: true,
      usersNotified: results.filter((r) => r.sent > 0).length,
      totalSignalsSent: results.reduce((sum, r) => sum + r.sent, 0),
      results,
    });
  } catch (e) {
    console.error("Cron notify error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
