import { WatchlistClient } from "@/components/WatchlistClient";

export const metadata = {
  title: "관심 종목 — 밸류맵",
  description: "관심 종목과 최근 본 종목을 한 화면에서 관리.",
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}