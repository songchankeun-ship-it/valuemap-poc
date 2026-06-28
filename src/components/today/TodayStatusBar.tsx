import { dataStatusByLocale } from "@/lib/dataStatus";
import { TodayStatusBarContent } from "./TodayStatusBarContent";

// 오늘 페이지 최상단 데이터 상태 바 (설계서 §7.2 / §16.4) — 얇은 서버 래퍼.
// 다국어 v2: dataStatusByLocale(직렬화 가능한 평문 문자열/숫자)를 클라이언트 표시부에 props로 넘긴다.
// 클라이언트가 useLanguage()로 로케일을 골라 배지 라벨·필드 라벨을 채운다.
export function TodayStatusBar() {
  return <TodayStatusBarContent dataStatusByLocale={dataStatusByLocale} />;
}
