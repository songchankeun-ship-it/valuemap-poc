"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

export type ScoreKind = "composite" | "momentum" | "flow" | "value" | "vol";

interface ScoreExplanation {
  title: string;
  oneLine: string;
  detail: string;
  howToRead: string;
  caveat: string; // 한계·왜곡 — 지표 가이드 §5-9 반영. 점수를 오해 없이 읽도록 마지막에 짧게.
}

const EXPLANATIONS: Record<ScoreKind, ScoreExplanation> = {
  composite: {
    title: "종합 점수",
    oneLine: "네 지표(추세·거래활성도·밸류·위험조정)의 평균.",
    detail: "0~100 비교 척도. 다른 종목과 견준 전반적 '데이터 우호도'예요. 추세·밸류는 현재 유니버스 안에서의 백분위라 종목 구성이 바뀌면 값도 달라집니다. 한 지표만 강하면 점수가 평범하고, 여러 지표가 함께 좋으면 점수가 높아집니다.",
    howToRead: "70 이상이면 4지표가 골고루 우호적. 50대는 중립. 30 이하는 4지표 모두 약함. ⚠ 이 점수는 매수 추천이 아니라 '데이터 기반 탐색 우선순위'입니다.",
    caveat: "4지표를 동일 가중해 평균한 값이라, 일부 지표가 비거나 한 지표만 극단적이면 해석이 왜곡될 수 있어요. 고정된 절대 점수가 아니라 현재 유니버스 기준 비교값입니다.",
  },
  momentum: {
    title: "추세 (모멘텀)",
    oneLine: "최근 1·3·6개월 가중평균 수익률.",
    detail: "가격이 최근에 얼마나 강하게 움직였는지. 최근 1개월(30%) + 3개월(40%) + 6개월(30%) 가중수익률을 전체 138개 종목 안에서 백분위(0~100)로 환산.",
    howToRead: "80 이상은 강한 상승세 — 다만 상승폭이 커져 변동성이 확대될 수 있습니다. 20 이하는 약세 — '저평가 국면'일 수도, '하락 추세'일 수도.",
    caveat: "하락 추세와 저평가 국면이 똑같이 낮은 점수로 보일 수 있어, 점수가 낮을 땐 왜 낮은지 함께 확인하세요.",
  },
  flow: {
    title: "거래활성도",
    oneLine: "최근 5일 거래량 ÷ 최근 20일 평균 거래량.",
    detail: "최근 5일 평균 거래량(주식 체결 수량)을 20일 평균과 비교. 1.0보다 크면 거래가 늘었다는 뜻. 거래대금(원)이 아니라 거래량으로만 계산합니다.",
    howToRead: "70 이상은 거래량이 평소보다 1.5배 이상 늘어난 상태 — 이슈·뉴스·공시·수급 변화 확인 필요. 30 이하는 거래량이 줄어드는 중.",
    caveat: "거래량 변화일 뿐 가격 방향(상승/하락)이나 누가 사고파는지(외국인·기관 등 매매 주체)는 알려주지 않아요. 일시적 이벤트성 급증일 수 있어 공시·뉴스 원문을 함께 확인하세요.",
  },
  value: {
    title: "밸류 (저평가)",
    oneLine: "PER·PBR이 풀(138개) 안에서 얼마나 낮은지.",
    detail: "PER, PBR 두 지표를 풀 내 백분위로 변환해 평균. 높을수록 풀 평균 대비 저평가. ⚠ 단, 이유 있는 저평가일 수도 있어 원문 확인 권장.",
    howToRead: "70 이상은 풀 내 하위 30% PER·PBR — 가격이 싸 보이지만 왜 싼지 봐야 합니다. 30 이하는 비싸 보임 — 성장 기대치가 반영된 것일 수도.",
    caveat: "적자기업이나 특수업종(지주·금융·리츠 등)은 PER·PBR이 왜곡돼 실제보다 싸거나 비싸 보일 수 있어요.",
  },
  vol: {
    title: "위험조정 (변동성조정)",
    oneLine: "수익률을 변동성으로 나눈 위험조정 수익률.",
    detail: "단순 수익률이 아니라 '얼마나 안정적으로 벌었나'를 봅니다. Sharpe Ratio 기반 — 같은 수익률이어도 출렁임이 적으면 점수가 높음.",
    howToRead: "70 이상은 수익률 대비 변동성이 낮음 — '꾸준한' 종목. 30 이하는 변동성이 큼 — 출렁임 감내 필요.",
    caveat: "표본 기간이 짧거나 거래가 적으면 변동성이 낮아 보이는 착시가 생길 수 있어요.",
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
          <div className="mt-2 flex items-start gap-1.5">
            <span className="text-amber-600 dark:text-amber-400 text-[11px] leading-relaxed shrink-0" aria-hidden="true">⚠</span>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              <span className="font-semibold">한계 </span>
              {exp.caveat}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
