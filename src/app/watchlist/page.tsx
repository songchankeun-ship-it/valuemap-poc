import { WatchlistClient } from "@/components/WatchlistClient";
import { getAllStocks } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "관심 종목 — 밸류맵",
};

export default async function WatchlistPage() {
  const allStocks = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
  }));

  // 로그인 여부 확인 (UI 안내용)
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = !!data.user;
  } catch {
    // ignore
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 mb-1">관심 종목</h1>
        <p className="text-xs text-zinc-600">
          {isLoggedIn
            ? "로그인 됨 — 여러 기기에서 같은 목록이 보입니다."
            : "현재는 이 브라우저에만 저장됩니다. 로그인하면 여러 기기에서 이어볼 수 있어요."}
        </p>
      </header>
      <WatchlistClient allStocks={allStocks} />
    </div>
  );
}