// 알림 종류 카탈로그 — 설계서 ornscore_commercialization_upgrade_spec.md §7.1 (필수 알림 9종)의
// 단일 소스. 순수 데이터 모듈(외부 의존 없음). 화면(설정 페이지)이 이 목록을 그대로 그려
// "어떤 알림을 받을 수 있고, 무엇이 이미 동작하고 무엇이 준비 중인지"를 투명하게 보여준다.
//
// status:
//   - 'live'    실제로 메일이 발송되는 알림(이미 cron 파이프라인 존재). 설정 페이지에서 진짜 컨트롤을 보여준다.
//   - 'preview' 제품 방향은 정해졌으나 아직 실제 발송 전. 설정 개념만 체험(로컬 저장)하고 발송은 하지 않는다.
//
// 톤 규칙(전역): 후보·탐색·확인·참고 정보 표현 유지. 매매 권유·가격 단정·수익 보장·압박성 카피는 만들지 않는다.

export type AlertCategory = "관심종목" | "점수" | "공시" | "필터" | "업종";
export type AlertStatus = "live" | "preview";
export type AlertExampleKind = "disclosure" | "scoreSurge" | "flowSurge";

export interface AlertType {
  /** 안정적 식별자(로컬 설정 키로 사용) */
  id: string;
  /** 화면 표시 라벨 */
  label: string;
  /** 중립 설명 — 무엇을 감지해 알려주는지. 투자 판단을 단정하지 않는다. */
  description: string;
  /** 묶음 표시용 카테고리 */
  category: AlertCategory;
  /** 이미 발송 동작 여부 */
  status: AlertStatus;
  /** 기존 흐름과의 연결점(설정 페이지에서 안내) */
  connectsTo: "관심 종목" | "저장 필터" | "—";
  /** 예시 카드와 연결되는 종류(있으면) */
  exampleKind?: AlertExampleKind;
}

export const ALERT_CATALOG: AlertType[] = [
  {
    id: "watchlist_disclosure",
    label: "관심 종목 공시 발생",
    description:
      "관심 종목에 자기주식 취득·임원/주요주주 보유 변동·정정·단일판매 계약·증자 등 DART 공시 신호가 새로 잡히면 알려드려요. 원문 확인용 참고 정보입니다.",
    category: "관심종목",
    status: "live",
    connectsTo: "관심 종목",
    exampleKind: "disclosure",
  },
  {
    id: "watchlist_score_surge",
    label: "관심 종목 종합 점수 급변",
    description:
      "관심 종목의 종합 점수가 최근 장마감 대비 크게 움직이면 변화 사실만 알려드려요. 점수는 탐색 우선순위용 참고 지표이며 매수·매도 신호가 아닙니다. (준비 중 · 아직 발송 전)",
    category: "관심종목",
    status: "preview",
    connectsTo: "관심 종목",
    exampleKind: "scoreSurge",
  },
  {
    id: "watchlist_flow_surge",
    label: "관심 종목 거래활성도 급증",
    description:
      "관심 종목의 최근 거래대금이 평소보다 눈에 띄게 늘면 알려드려요. 관심이 몰리고 있다는 참고 신호로, 방향(상승/하락)을 뜻하지는 않습니다. (준비 중 · 아직 발송 전)",
    category: "관심종목",
    status: "preview",
    connectsTo: "관심 종목",
    exampleKind: "flowSurge",
  },
  {
    id: "watchlist_overheat",
    label: "관심 종목 과열 주의 발생",
    description:
      "관심 종목이 단기 급변동·과열 구간에 들어가면 '주의해서 확인하라'는 의미로 알려드려요. 회피·매도 권유가 아니라 변동성 점검용 안내입니다. (준비 중 · 아직 발송 전)",
    category: "관심종목",
    status: "preview",
    connectsTo: "관심 종목",
  },
  {
    id: "score_enter_80",
    label: "종합 점수 80점 이상 진입",
    description:
      "탐색 대상 종목이 종합 점수 80점 구간에 새로 들어오면 후보로 살펴볼 수 있게 알려드려요. 점수는 참고 지표이며 매수 추천이 아닙니다. (준비 중 · 아직 발송 전)",
    category: "점수",
    status: "preview",
    connectsTo: "—",
  },
  {
    id: "saved_filter_match",
    label: "저장 필터 조건 충족 종목 발생",
    description:
      "종목 탐색에서 저장한 조건에 새 종목이 들어오면 알려드려요(현재는 임시로 이메일 발송, 카카오톡 알림은 준비 중). 저장한 탐색 기준을 다시 맞춰볼 필요 없이 변화만 확인합니다.",
    category: "필터",
    status: "live",
    connectsTo: "저장 필터",
  },
  {
    id: "disclosure_importance_80",
    label: "공시 중요도 80점 이상 발생",
    description:
      "중요도가 높게 분류된 공시가 올라오면 먼저 확인하도록 알려드려요. 중요도는 자동 분류 참고값이고, 호재·악재를 단정하지 않습니다. (준비 중 · 아직 발송 전)",
    category: "공시",
    status: "preview",
    connectsTo: "—",
  },
  {
    id: "sector_rank_change",
    label: "업종 내 순위 변화",
    description:
      "관심 종목의 같은 업종 안 상대 순위가 의미 있게 바뀌면 알려드려요. 업종 비교 표본이 적을 수 있어 참고용으로만 봅니다. (준비 중 · 아직 발송 전)",
    category: "업종",
    status: "preview",
    connectsTo: "관심 종목",
  },
  {
    id: "backtest_match",
    label: "백테스트 조건 충족 종목 발생",
    description:
      "실험 백테스트 전략의 조건에 새로 부합하는 종목이 생기면 알려드려요. 백테스트는 과거 가정 기반 실험이며 미래 수익을 보장하지 않습니다. (준비 중 · 아직 발송 전)",
    category: "필터",
    status: "preview",
    connectsTo: "저장 필터",
  },
];

/** 카테고리 표시 순서·라벨 */
export const ALERT_CATEGORY_ORDER: AlertCategory[] = ["관심종목", "점수", "공시", "필터", "업종"];

export const ALERT_CATEGORY_LABEL: Record<AlertCategory, string> = {
  관심종목: "관심 종목",
  점수: "점수",
  공시: "공시",
  필터: "저장 필터·백테스트",
  업종: "업종",
};

export function groupAlertsByCategory(): { category: AlertCategory; items: AlertType[] }[] {
  return ALERT_CATEGORY_ORDER.map((category) => ({
    category,
    items: ALERT_CATALOG.filter((a) => a.category === category),
  })).filter((g) => g.items.length > 0);
}
