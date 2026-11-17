import { ImageResponse } from "next/og";
import { resolveComparison } from "@/lib/comparison";
import { dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import { getOgImageFonts } from "@/lib/ogImageFonts";

export const runtime = "nodejs";
export const alt = "오른스코어 종목 비교";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const data = resolveComparison(pair);
  const fonts = await getOgImageFonts();
  if (!data) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white", fontSize: 48 }}>
        비교를 찾을 수 없습니다
      </div>,
      { ...size, fonts },
    );
  }

  const score = data.metrics.find((metric) => metric.key === "composite");
  const keyMetrics = data.metrics.filter((metric) => ["momentum", "flow", "value", "vol"].includes(metric.key));

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc", color: "#0f172a", padding: "54px 70px", fontFamily: "Pretendard" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#2563eb", color: "white", fontSize: 28, fontWeight: 700 }}>O</div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>오른스코어</div>
        </div>
        <div style={{ display: "flex", fontSize: 18, color: "#64748b" }}>{`${formatBizDateLong(dataMetadata.asOfBusinessDate)} 기준`}</div>
      </div>

      <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 24 }}>
        {[data.a, data.b].map((stock, index) => (
          <div key={stock.ticker} style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #cbd5e1", borderRadius: 12, background: "white", padding: "28px 30px" }}>
            <div style={{ display: "flex", fontSize: 22, color: "#64748b" }}>{`${stock.sector} · ${stock.ticker}`}</div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 46, fontWeight: 700 }}>{stock.name}</div>
            <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: index === 0 ? "#2563eb" : "#0f766e" }}>{index === 0 ? score?.a.display : score?.b.display}</div>
              <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>종합 점수</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        {keyMetrics.map((metric) => (
          <div key={metric.key} style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 8, background: "#e2e8f0", padding: "13px 16px" }}>
            <div style={{ display: "flex", fontSize: 17, color: "#475569" }}>{metric.label}</div>
            <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between", fontSize: 23, fontWeight: 700 }}>
              <span>{metric.a.display}</span><span>{metric.b.display}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd5e1", paddingTop: 18, fontSize: 18, color: "#64748b" }}>
        <span>전망 대신 같은 기준의 숫자로 나란히 확인</span>
        <span>탐색 보조 · 매수·매도 추천 아님</span>
      </div>
    </div>,
    { ...size, fonts },
  );
}
