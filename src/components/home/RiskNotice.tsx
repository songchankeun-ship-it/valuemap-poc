import { dataStatusByLocale } from "@/lib/dataStatus";
import { RiskNoticeContent } from "./RiskNoticeContent";

// 투자 추천 아님 · 탐색 도구 고지 — 얇은 서버 래퍼.
// 다국어 v2: dataStatusByLocale(직렬화 가능)를 클라이언트 표시부에 props로 넘긴다.
// 본문 3줄은 클라이언트가 로케일별 disclaimer에서, 제목은 statusCopy에서 읽는다.
export function RiskNotice() {
  return <RiskNoticeContent dataStatusByLocale={dataStatusByLocale} />;
}
