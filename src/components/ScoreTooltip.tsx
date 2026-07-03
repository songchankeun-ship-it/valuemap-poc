"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

export type ScoreKind = "composite" | "momentum" | "flow" | "value" | "vol";

interface ScoreExplanation {
  title: string;
  oneLine: string;
  detail: string;
  howToRead: string;
}

const EXPLANATIONS: Record<ScoreKind, ScoreExplanation> = {
  composite: {
    title: "종합 점수",
    oneLine: "네 지표(추세·거래활성도·밸류·위험조정)의 평균.",
    detail: "0~100 척도. 한 종목의 전반적 '데이터 우호도'를 보여줍니다. 한 지표만 강하면 점수가 평범하고, 여러 지표가 함께 좋으면 점수가 높아집니다.",
    howToRead: "70 이상이면 4지표가 골고루 우호적. 50대는 중립. 30 이하는 4지표 모두 약함. ⚠ 이 점수는 매수 추천이 아니라 '데이터 기반 탐색 우선순위'입니다.",
  },
  momentum: {
    title: "추세 (모멘텀)",
    oneLine: "최근 1·3·6개월 가중평균 수익률.",
    detail: "가격이 최근에 얼마나 강하게 움직였는지. 최근 1개월(35%) + 3개월(35%) + 6개월(30%) 가중치로 계산해서 0~100 정규화.",
    howToRead: "80 이상은 강한 상승세 — 다만 상승폭이 커져 변동성이 확대될 수 있습니다. 20 이하는 약세 — '저평가 국면'일 수도, '하락 추세'일 수도.",
  },
  flow: {
    title: "거래활성도",
    oneLine: "최근 5일 거래량 ÷ 최근 20일 평균.",
    detail: "최근 5일 평균 거래량을 20일 평균과 비교. 1.0보다 크면 거래가 늘었다는 뜻. 자금이 들어오는 종목은 보통 거래량부터 늘어납니다.",
    howToRead: "70 이상은 거래량이 평소보다 1.5배 이상 늘어난 상태 — 이슈·뉴스·공시·수급 변화 확인 필요. 30 이하는 거래량이 줄어드는 중.",
  },
  value: {
    title: "밸류 (저평가)",
    oneLine: "PER·PBR이 풀(138개) 안에서 얼마나 낮은지.",
    detail: "PER, PBR 두 지표를 풀 내 백분위로 변환해 평균. 높을수록 풀 평균 대비 저평가. ⚠ 단, 이유 있는 저평가일 수도 있어 원문 확인 권장.",
    howToRead: "70 이상은 풀 내 하위 30% PER·PBR — 가격이 싸 보이지만 왜 싼지 봐야 합니다. 30 이하는 비싸 보임 — 성장 기대치가 반영된 것일 수도.",
  },
  vol: {
    title: "위험조정 (변동성조정)",
    oneLine: "수익률을 변동성으로 나눈 위험조정 수익률.",
    detail: "단순 수익률이 아니라 '얼마나 안정적으로 벌었나'를 봅니다. Sharpe Ratio 기반 — 같은 수익률이어도 출렁임이 적으면 점수가 높음.",
    howToRead: "70 이상은 수익률 대비 변동성이 낮음 — '꾸준한' 종목. 30 이하는 변동성이 큼 — 출렁임 감내 필요.",
  },
};

interface Props {
  kind: ScoreKind;
  inline?: boolean; // true면 (?) 아이콘만, false면 라벨 전체 클릭 가능
  size?: "sm" | "md";
}

export function ScoreTooltip({ kind, inline = true, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const exp = EXPLANATIONS[kind];
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center w-9 h-9 -m-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:bg-blue-100 dark:active:bg-blue-900/40 transition"
        aria-label={`${exp.title} 설명`}
        title={exp.oneLine}
      >
        <HelpCircle className={iconSize} strokeWidth={2} />
      </button>

      {open ? (
        <div
          className="absolute z-50 top-full left-0 mt-1.5 w-72 max-w-[80vw] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3.5 text-left"
          role="dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-baseline justify-between mb-1.5 gap-2">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{exp.title}</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-medium"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1.5 leading-snug">
            {exp.oneLine}
          </p>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">
            {exp.detail}
          </p>
          <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-md p-2 border border-zinc-100 dark:border-zinc-700">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              어떻게 읽나
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {exp.howToRead}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
