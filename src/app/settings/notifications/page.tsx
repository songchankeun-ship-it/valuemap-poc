import { NotificationToggle } from "@/components/NotificationToggle";
import { ConditionAlertsManager } from "@/components/ConditionAlertsManager";
import { AlertTypeCatalog } from "@/components/notifications/AlertTypeCatalog";
import { NotificationChannels } from "@/components/notifications/NotificationChannels";
import {
  AlertExampleCards,
  type AlertExampleData,
} from "@/components/notifications/AlertExampleCards";
import { KakaoAlertPreview } from "@/components/notifications/KakaoAlertPreview";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Heart, Mail, Info, LogIn } from "lucide-react";
import recentSignalsRaw from "../../../../public/disclosure-samples/recent-signals.json";
import { realStockPool } from "@/lib/realStocks";
import { compositeOf } from "@/lib/score";
import { getScoreChangesBatch } from "@/lib/scoreHistory";

export const metadata = {
  title: "알림 설정 — 오른스코어",
};

interface RawSignal {
  signalType?: string;
  signalLabel?: string;
  strength?: number;
  note?: string;
  disclosure?: { corp_name?: string; stock_code?: string };
}

/** 알림 예시 카드용 데이터를 실제 데이터에서 서버사이드로 구성(그레이스풀). */
async function buildExampleData(): Promise<AlertExampleData> {
  const data: AlertExampleData = {};

  // 1) 공시 예시 — 최근 신호 중 강도 최댓값
  const signals = ((recentSignalsRaw as { signals?: RawSignal[] }).signals ?? []).filter(
    (s) => s.disclosure?.corp_name && s.disclosure?.stock_code && s.signalLabel
  );
  if (signals.length > 0) {
    const top = signals.reduce((a, b) => ((b.strength ?? 0) > (a.strength ?? 0) ? b : a));
    data.disclosure = {
      name: top.disclosure!.corp_name!,
      ticker: top.disclosure!.stock_code!,
      label: top.signalLabel!,
      note: top.note,
    };
  }

  // 2) 거래활성도 급증 예시 — flowStats.ratio 최댓값(실데이터)
  const flowMover = realStockPool
    .filter((s) => typeof s.flowStats?.ratio === "number" && (s.flowStats!.ratio as number) > 1)
    .sort((a, b) => (b.flowStats!.ratio as number) - (a.flowStats!.ratio as number))[0];
  if (flowMover) {
    data.flowSurge = {
      name: flowMover.name,
      ticker: flowMover.ticker,
      ratio: flowMover.flowStats!.ratio as number,
    };
  }

  // 3) 점수 급변 예시 — daily_scores 실제 전일 대비 변화(있으면). 없으면 표본 종목으로 형식만 예시.
  try {
    const tickers = realStockPool.map((s) => s.ticker);
    const deltas = await getScoreChangesBatch(tickers);
    const entries = Object.entries(deltas).filter(([, d]) => Math.abs(d) >= 1);
    if (entries.length > 0) {
      entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      const [ticker, delta] = entries[0];
      const stock = realStockPool.find((s) => s.ticker === ticker);
      if (stock) {
        const to = Math.round(compositeOf(stock));
        data.scoreSurge = { name: stock.name, ticker, from: to - Math.round(delta), to };
      }
    }
  } catch {
    // ignore — 아래 폴백
  }
  if (!data.scoreSurge) {
    // 시계열 미축적 환경: 실종목의 현재 점수를 '도착점'으로 한 형식 예시(예시 태그·고지로 명시)
    const sample = [...realStockPool]
      .map((s) => ({ s, score: Math.round(compositeOf(s)) }))
      .filter((x) => x.score >= 60 && x.score <= 90)
      .sort((a, b) => b.score - a.score)[0];
    if (sample) {
      data.scoreSurge = {
        name: sample.s.name,
        ticker: sample.s.ticker,
        from: Math.max(0, sample.score - 7),
        to: sample.score,
      };
    }
  }

  return data;
}

export default async function NotificationSettingsPage() {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  } catch {
    // ignore
  }

  const exampleData = await buildExampleData();

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        홈으로
      </Link>

      <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">알림 설정</h1>
      <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mb-5 md:mb-6">
        관심 종목·저장 필터의 변화를 알림으로 받는 방법을 설정해요. 어떤 알림이 동작하고 무엇이 준비 중인지 투명하게 보여드립니다.
      </p>

      {/* 0. 전체 상태 안내 — 정직한 MVP 고지 */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3.5 md:p-4 mb-5 md:mb-6">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="min-w-0 text-xs md:text-[13px] text-blue-900 dark:text-blue-200 leading-relaxed break-words">
            <strong>지금은 제품 알림 2종(관심 종목 공시 · 저장 필터 충족)만 발송되며, 이메일은 그때까지의 임시(베타) 채널이에요.</strong>{" "}
            앞으로 제품 알림은 <strong>카카오톡 알림</strong>을 우선 방향으로 준비 중입니다(아직 미발송). 이메일을 장기 메인 알림 경로로
            두지는 않아요. 참고로 <strong>로그인 매직링크 메일</strong>(계정 로그인용)은 제품 알림과 별개입니다. 아래 다른 알림 종류와
            그 밖의 채널(웹·텔레그램·카카오·앱 푸시)은 준비 중이라 아직 보내지 않으며, 준비 중 항목은 설정 개념만 미리
            체험할 수 있고 켜둬도 메시지가 나가지 않아요.
          </div>
        </div>
      </div>

      {/* 1. 실제 발송되는 설정(로그인 시 저장) */}
      <div id="live-controls" className="scroll-mt-4">
        {userEmail ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap md:flex-nowrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">공시 신호 알림</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  관심 종목에 자기주식 취득·임원·주요주주 보유 변동·정정공시·단일판매 계약·유상증자 등 신호가 발견되면 매일 한 번 이메일로 발송됩니다.
                </div>
              </div>
              <NotificationToggle />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Mail className="w-3 h-3" />
              <span>
                발송: <strong className="text-zinc-700 dark:text-zinc-300">{userEmail}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">로그인하면 알림 설정이 저장돼요</div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              아래 알림 종류·예시는 로그인 없이도 둘러볼 수 있어요. 로그인은 비밀번호 없이 매직링크 메일로 진행되며(계정 로그인용),
              이는 제품 알림과 별개입니다. 현재 제품 알림(관심 종목 공시·저장 필터 충족)은 임시로 로그인 계정 메일로 발송되고 설정도
              계정에 저장되며, 앞으로는 카카오톡 알림을 우선 방향으로 준비 중입니다(아직 미발송).
            </p>
            <Link
              href="/login?next=/settings/notifications"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              <LogIn className="w-4 h-4" />
              로그인하고 알림 받기
            </Link>
          </div>
        )}

        <div className="mb-4 md:mb-6">
          <ConditionAlertsManager />
        </div>
      </div>

      {/* 2. 알림 종류 카탈로그 */}
      <div className="mb-4 md:mb-6">
        <AlertTypeCatalog />
      </div>

      {/* 3. 알림 채널 */}
      <div className="mb-4 md:mb-6">
        <NotificationChannels />
      </div>

      {/* 4. 알림 예시 */}
      <div className="mb-4 md:mb-6">
        <AlertExampleCards data={exampleData} />
      </div>

      {/* 4-1. 카카오톡 알림 미리보기(정적·무발송) */}
      <div className="mb-4 md:mb-6">
        <KakaoAlertPreview data={exampleData} />
      </div>

      {/* 5. 알림 받으려면 */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
          알림 받으려면
        </h3>
        <ol className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-2">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">1.</span>
            <div>
              종목 페이지에서 <Heart className="w-3 h-3 inline" /> <strong>관심 종목</strong> 버튼으로 등록(또는 종목 탐색에서 <strong>조건 저장</strong>)
            </div>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">2.</span>
            <div>매일 KST 16:30 (장 마감 후) 자동으로 신호·조건 분석</div>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">3.</span>
            <div>새 신호가 있으면 이메일 도착 (없으면 발송 안 함)</div>
          </li>
        </ol>
      </div>
    </div>
  );
}
