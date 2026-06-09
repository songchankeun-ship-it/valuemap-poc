import { ImageResponse } from "next/og";
import { getStockByTicker } from "@/lib/mockData";

export const runtime = "nodejs";
export const alt = "밸류맵 종목 분석";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { ticker: string } }) {
  const s = getStockByTicker(params.ticker);

  if (!s) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F172A",
            color: "white",
            fontSize: 48,
          }}
        >
          종목을 찾을 수 없습니다
        </div>
      ),
      { ...size }
    );
  }

  const composite = Math.round((s.momentum + s.flow + s.value + s.vol) / 4);
  const scoreColor = composite >= 70 ? "#10B981" : composite >= 50 ? "#3B82F6" : "#94A3B8";

  const metrics = [
    { label: "M", full: "모멘텀", score: s.momentum, color: "#3B82F6" },
    { label: "F", full: "자금흐름", score: s.flow, color: "#10B981" },
    { label: "V", full: "밸류", score: s.value, color: "#06B6D4" },
    { label: "Vo", full: "변동성조정", score: s.vol, color: "#F97316" },
  ];

  const isUp = s.changePct >= 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "white",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* 헤더 — 밸류맵 로고 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 30, color: "#0F172A", fontWeight: 700 }}>
            밸류맵
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <div style={{ fontSize: 18, color: "#64748B", fontWeight: 500 }}>valuemap.kr</div>
          </div>
        </div>

        {/* 종목명 + 티커 */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#0F172A" }}>{s.name}</div>
          <div
            style={{
              fontSize: 24,
              color: "#94A3B8",
              fontFamily: "monospace",
              padding: "6px 14px",
              borderRadius: 8,
              background: "#F1F5F9",
            }}
          >
            {s.ticker}
          </div>
        </div>

        {/* 가격 + 등락률 */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 40 }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#0F172A" }}>
            {s.currentPrice.toLocaleString()}원
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: isUp ? "#DC2626" : "#2563EB" }}>
            {isUp ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
          </div>
        </div>

        {/* 큰 점수 + 4지표 */}
        <div style={{ display: "flex", alignItems: "center", gap: 48, marginBottom: 40 }}>
          {/* 큰 점수 원 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: scoreColor,
              color: "white",
            }}
          >
            <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{composite}</div>
            <div style={{ fontSize: 16, opacity: 0.8, marginTop: 4 }}>/ 100</div>
          </div>

          {/* 4지표 바 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 100, fontSize: 18, color: "#475569", fontWeight: 600 }}>
                  {m.full}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 18,
                    background: "#E2E8F0",
                    borderRadius: 9,
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: `${m.score}%`,
                      height: "100%",
                      background: m.color,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 40,
                    textAlign: "right",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {Math.round(m.score)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 — 면책 */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 20,
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 16,
            color: "#64748B",
          }}
        >
          <div>탐색 우선순위 · 매수·매도 추천이 아닙니다</div>
          <div style={{ fontWeight: 600, color: "#0F172A" }}>밸류맵 · 한국 테마주 분석 도구</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
