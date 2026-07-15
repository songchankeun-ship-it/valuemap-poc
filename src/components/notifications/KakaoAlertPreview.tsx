import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import type { AlertExampleData } from "./AlertExampleCards";

// 카카오톡 알림톡 말풍선 형태의 정적 인앱 프리뷰(설계서/백로그 Stage 1 item B).
// 순수 표시 컴포넌트 — 네트워크 요청 없음. 값은 서버에서 실제 데이터(최근 공시 신호·점수 변화)로
// 채워 넘긴 AlertExampleData 를 재사용한다. "예시" 태그 + "실제 발송된 메시지가 아닙니다" 고지를
// 반드시 붙여, 카카오톡 알림이 이미 발송되는 것으로 오해하지 않게 한다.
// 톤 규칙: 참고 정보·확인 유도만. 매매 권유·가격 단정·수익 단정성 표현은 넣지 않는다.

const CHANNEL_NAME = "오른스코어";

interface PreviewMessage {
  title: string;
  lines: string[];
  ticker: string;
  buttonLabel: string;
}

/** 넘어온 예시 데이터에서 말풍선 본문을 만든다(공시 → 점수 급변 순 폴백). 없으면 null. */
function buildMessage(data: AlertExampleData): PreviewMessage | null {
  const { disclosure, scoreSurge } = data;
  if (disclosure) {
    return {
      title: "관심 종목 새 공시",
      lines: [
        `${disclosure.name}(${disclosure.ticker})에 새 공시 신호가 감지됐어요: ${disclosure.label}`,
        "호재·악재를 단정하지 않는 참고 정보예요. DART 원문에서 규모·방향을 직접 확인하세요.",
      ],
      ticker: disclosure.ticker,
      buttonLabel: "종목에서 확인",
    };
  }
  if (scoreSurge) {
    const diff = scoreSurge.to - scoreSurge.from;
    return {
      title: "관심 종목 점수 변화",
      lines: [
        `${scoreSurge.name} 종합 점수가 ${scoreSurge.from}→${scoreSurge.to}로 움직였어요(${diff > 0 ? "+" : ""}${diff}${scoreSurge.basisLabel ? ` · ${scoreSurge.basisLabel}` : ""}).`,
        "점수는 탐색 우선순위용 참고 지표예요. 변화 사실만 알리고 매매를 권하지 않습니다.",
      ],
      ticker: scoreSurge.ticker,
      buttonLabel: "근거 보기",
    };
  }
  return null;
}

export function KakaoAlertPreview({ data }: { data: AlertExampleData }) {
  const msg = buildMessage(data);
  if (!msg) return null;

  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">카카오톡 알림 미리보기</h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
        카카오톡 알림이 준비되면 이런 형식으로 도착해요. 아래는 형식 예시이며, <strong>실제 발송된 메시지가 아닙니다</strong>. 지금은
        관심 종목 공시·저장 필터 충족 알림만 임시로 이메일로 동작합니다.
      </p>

      {/* 카카오톡 채팅 배경 위 말풍선(정적 미리보기) */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#b2c7d9] dark:bg-zinc-800/60 p-3 md:p-4 min-w-0">
        {/* 발신 채널 헤더 */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#fee500] text-[#3c1e1e] shrink-0">
            <MessageCircle className="w-4 h-4" />
          </span>
          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">{CHANNEL_NAME}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
            채널
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            예시
          </span>
        </div>

        {/* 말풍선 */}
        <div className="max-w-[300px]">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-tl-sm p-3 shadow-sm min-w-0">
            <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 break-words">
              [오른스코어] {msg.title}
            </div>
            <div className="mt-1.5 space-y-1">
              {msg.lines.map((line, i) => (
                <p key={i} className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed break-words">
                  {line}
                </p>
              ))}
            </div>
            {/* 웹링크 버튼(앱 내부 이동 · 외부 요청 없음) */}
            <Link
              href={`/stock/${msg.ticker}`}
              className="mt-3 flex items-center justify-center gap-1 w-full min-h-[44px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-800 transition"
            >
              {msg.buttonLabel}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-zinc-600 dark:text-zinc-400 break-words">
          ※ 예시 · 실제 발송된 메시지가 아닙니다. 투자 추천이 아닌 데이터 기반 참고 정보입니다.
        </p>
      </div>
    </div>
  );
}
