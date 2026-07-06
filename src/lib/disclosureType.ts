// 공시 타입별 단일 소스 — 색상/아이콘/라벨/톤을 한 곳에서 정의한다.
// 2026-07-06 디자인 재검수: 공시 유형 색은 주가 상승/하락처럼 읽히지 않도록 중립색 위주로 쓴다.
// 접근성: 색은 항상 텍스트 라벨/도트와 함께 쓴다(색만으로 의미 전달 금지).
// 비자문 원칙: 호재/악재 단정 없이 '분류'만 한다.

import {
  Landmark,
  Users,
  Handshake,
  PencilLine,
  Banknote,
  type LucideIcon,
} from "lucide-react";

export interface DisclosureTypeMeta {
  key: string; // signalType
  label: string; // 카드/대시보드 표기 라벨
  shortLabel: string; // 칩 등 짧은 라벨
  Icon: LucideIcon;
  iconName: string;
  // Tailwind 정적 리터럴만 사용(런타임 색 합성 금지 — purge 누락 회피)
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dot: string;
  cardBorder: string; // 카드 좌측/외곽 은은한 강조 테두리
}

// 설계서 §10.5 대시보드 노출 순서(자사주·보유변동·대형계약·손익정정·유증/CB)
export const DISCLOSURE_TYPE_ORDER = [
  "treasury_buy",
  "insider_buy",
  "single_contract",
  "correction",
  "capital_raise",
] as const;

const META: Record<string, DisclosureTypeMeta> = {
  // 공시 유형은 모두 중립톤. 의미 구분은 색보다 라벨/아이콘/확인 포인트가 맡는다.
  treasury_buy: {
    key: "treasury_buy",
    label: "자사주",
    shortLabel: "자사주",
    Icon: Landmark,
    iconName: "Landmark",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    cardBorder: "border-zinc-200 dark:border-zinc-800",
  },
  insider_buy: {
    key: "insider_buy",
    label: "보유 변동",
    shortLabel: "보유변동",
    Icon: Users,
    iconName: "Users",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    dot: "bg-zinc-400",
    cardBorder: "border-zinc-200 dark:border-zinc-800",
  },
  single_contract: {
    key: "single_contract",
    label: "대형 계약",
    shortLabel: "대형계약",
    Icon: Handshake,
    iconName: "Handshake",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    dot: "bg-neutral-400",
    cardBorder: "border-zinc-200 dark:border-zinc-800",
  },
  correction: {
    key: "correction",
    label: "손익 정정",
    shortLabel: "정정",
    Icon: PencilLine,
    iconName: "PencilLine",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    dot: "bg-stone-400",
    cardBorder: "border-zinc-200 dark:border-zinc-800",
  },
  capital_raise: {
    key: "capital_raise",
    label: "유증/CB",
    shortLabel: "유증/CB",
    Icon: Banknote,
    iconName: "Banknote",
    badgeBg: "bg-slate-50 dark:bg-slate-900/50",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    dot: "bg-gray-400",
    cardBorder: "border-zinc-200 dark:border-zinc-800",
  },
};

// 미분류/알 수 없는 타입 폴백(중립 회색)
const FALLBACK: DisclosureTypeMeta = {
  key: "unknown",
  label: "기타 공시",
  shortLabel: "기타",
  Icon: PencilLine,
  iconName: "PencilLine",
  badgeBg: "bg-zinc-100 dark:bg-zinc-800",
  badgeText: "text-zinc-700 dark:text-zinc-300",
  badgeBorder: "border-zinc-200 dark:border-zinc-700",
  dot: "bg-zinc-400",
  cardBorder: "border-zinc-200 dark:border-zinc-700",
};

/** signalType → 타입 메타(없으면 중립 폴백). */
export function typeMetaOf(signalType?: string): DisclosureTypeMeta {
  if (!signalType) return FALLBACK;
  return META[signalType] ?? FALLBACK;
}
