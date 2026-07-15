import { FileText, TrendingUp, Activity, Clock3 } from "lucide-react";

// 알림이 실제로 어떻게 보일지 형식을 보여주는 예시 카드(설계서 §7.4 형식).
// 순수 표시 컴포넌트 — 값은 서버에서 실제 데이터(최근 공시 신호·점수 변화·거래활성도)로 채워 넘긴다.
// 모든 카드에 '예시' 태그와 투자 추천 아님 고지를 붙여, 실제 발송 메시지로 오해하지 않게 한다.

export interface DisclosureExample {
  name: string;
  ticker: string;
  label: string;
  note?: string;
}
export interface ScoreSurgeExample {
  name: string;
  ticker: string;
  from: number;
  to: number;
  /** 델타의 실제 비교 기준 라벨(전 거래일 / N거래일 전 / 최근 저장 데이터). 실데이터일 때만 주어진다. */
  basisLabel?: string;
}
export interface FlowSurgeExample {
  name: string;
  ticker: string;
  ratio: number; // 최근 거래대금 / 평소 (배)
}

export interface AlertExampleData {
  disclosure?: DisclosureExample;
  scoreSurge?: ScoreSurgeExample;
  flowSurge?: FlowSurgeExample;
}

const FOOTER = "본 알림은 투자 추천이 아닌 데이터 기반 참고 정보입니다.";

function ExampleShell({
  icon,
  title,
  children,
  preparing = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  /** 아직 발송 전인 종류(미리보기)면 '준비 중' 태그를 추가로 붙인다. 실제 발송(live)은 '예시'만. */
  preparing?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 min-w-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          {icon}
          <span className="text-xs font-medium">{title}</span>
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          예시
        </span>
        {preparing ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
            <Clock3 className="w-3 h-3" />
            준비 중
          </span>
        ) : null}
      </div>
      <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">{children}</div>
      <p className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500 break-words">
        ※ {FOOTER}
      </p>
    </div>
  );
}

export function AlertExampleCards({ data }: { data: AlertExampleData }) {
  const { disclosure, scoreSurge, flowSurge } = data;
  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">알림 예시</h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
        알림이 도착하면 이런 형식으로 보여요. 아래는 최근 데이터로 만든 형식 예시이며, <strong>실제 발송된 메시지가 아닙니다</strong>.
        관심 종목 공시 알림만 지금 이메일로 동작하고, <span className="text-amber-700 dark:text-amber-400">준비 중</span> 표시가 붙은 종류는 아직 발송 전이에요.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {disclosure ? (
          <ExampleShell icon={<FileText className="w-3.5 h-3.5" />} title="관심 종목 공시 발생">
            <div className="font-semibold">
              {disclosure.name}{" "}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">{disclosure.ticker}</span>
            </div>
            <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-300">
              새 공시 신호: <strong>{disclosure.label}</strong>
            </div>
            {disclosure.note ? (
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{disclosure.note}</div>
            ) : null}
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">DART 원문에서 규모·방향을 직접 확인하세요.</div>
          </ExampleShell>
        ) : null}

        {scoreSurge ? (
          <ExampleShell icon={<TrendingUp className="w-3.5 h-3.5" />} title="관심 종목 종합 점수 급변" preparing>
            <div className="font-semibold">
              {scoreSurge.name}{" "}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">{scoreSurge.ticker}</span>
            </div>
            <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-300 tabular-nums">
              종합 점수 {scoreSurge.from} → <strong>{scoreSurge.to}</strong>
              <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                ({scoreSurge.to - scoreSurge.from > 0 ? "+" : ""}
                {scoreSurge.to - scoreSurge.from})
              </span>
              {scoreSurge.basisLabel ? (
                <span className="ml-1 text-[11px] text-zinc-400 dark:text-zinc-500">· {scoreSurge.basisLabel}</span>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              점수는 탐색 우선순위용 참고 지표예요. 변화 사실만 알리고, 매수·매도를 권하지 않습니다.
            </div>
          </ExampleShell>
        ) : null}

        {flowSurge ? (
          <ExampleShell icon={<Activity className="w-3.5 h-3.5" />} title="관심 종목 거래활성도 급증" preparing>
            <div className="font-semibold">
              {flowSurge.name}{" "}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">{flowSurge.ticker}</span>
            </div>
            <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-300 tabular-nums">
              최근 거래대금이 평소의 <strong>약 {flowSurge.ratio.toFixed(1)}배</strong>
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              관심이 몰리고 있다는 참고 신호예요. 방향(상승/하락)을 뜻하지는 않습니다.
            </div>
          </ExampleShell>
        ) : null}
      </div>
    </div>
  );
}
