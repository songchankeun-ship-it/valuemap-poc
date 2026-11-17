import { ImageResponse } from "next/og";
import { getSeoTopic } from "@/lib/seoTopics";
import { dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import { getOgImageFonts } from "@/lib/ogImageFonts";

export const runtime = "nodejs";
export const alt = "오른스코어 종목 탐색 주제";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getSeoTopic(slug);
  const fonts = await getOgImageFonts();
  if (!topic) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white", fontSize: 48 }}>
        탐색 주제를 찾을 수 없습니다
      </div>,
      { ...size, fonts },
    );
  }

  const stocks = topic.stockSelector().slice(0, 3);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", color: "#0f172a", padding: "56px 72px", fontFamily: "Pretendard" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#2563eb", color: "white", fontSize: 28, fontWeight: 700 }}>O</div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>오른스코어</div>
        </div>
        <div style={{ display: "flex", fontSize: 18, color: "#64748b" }}>{`${formatBizDateLong(dataMetadata.asOfBusinessDate)} 기준`}</div>
      </div>

      <div style={{ marginTop: 48, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#2563eb" }}>{`${topic.category} · ${dataMetadata.count}종목에서 탐색`}</div>
        <div style={{ display: "flex", marginTop: 12, maxWidth: 970, fontSize: 50, lineHeight: 1.18, fontWeight: 700, letterSpacing: 0 }}>{topic.h1}</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 23, color: "#475569" }}>낮거나 높은 숫자는 결론이 아니라 다음 확인의 시작점입니다.</div>
      </div>

      <div style={{ marginTop: 36, display: "flex", gap: 14 }}>
        {stocks.map((stock, index) => (
          <div key={stock.ticker} style={{ flex: 1, display: "flex", alignItems: "center", gap: 16, border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", padding: "18px 20px" }}>
            <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "#dbeafe", color: "#1d4ed8", fontSize: 20, fontWeight: 700 }}>{index + 1}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>{stock.name}</div>
              <div style={{ display: "flex", marginTop: 3, fontSize: 16, color: "#64748b" }}>{stock.ticker}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd5e1", paddingTop: 18, fontSize: 18, color: "#64748b" }}>
        <span>전망 대신 숫자로 오늘 먼저 볼 종목을 줄입니다</span>
        <span>탐색 보조 · 매수·매도 추천 아님</span>
      </div>
    </div>,
    { ...size, fonts },
  );
}
