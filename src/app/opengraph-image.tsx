import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "밸류맵 — 한국 테마주 분석 도구";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #DBEAFE 0%, #E0F2FE 50%, #F0F9FF 100%)",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 36, color: "#0F172A", fontWeight: 700 }}>
            밸류맵
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#1E40AF",
            marginBottom: 24,
            letterSpacing: 3,
            fontWeight: 600,
            display: "flex",
          }}
        >
          한국 테마주 분석 도구
        </div>
        <div
          style={{
            fontSize: 92,
            color: "#0F172A",
            fontWeight: 800,
            lineHeight: 1.15,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>&quot;바닥일까,</div>
          <div>아직 더 떨어질까.&quot;</div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#475569",
            marginTop: 40,
            textAlign: "center",
            display: "flex",
            gap: 24,
          }}
        >
          <span>138개 종목</span>
          <span style={{ color: "#CBD5E1" }}>·</span>
          <span>자체 지표 4종</span>
          <span style={{ color: "#CBD5E1" }}>·</span>
          <span>DART 공시 신호</span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10B981",
            }}
          />
          <div style={{ fontSize: 22, color: "#64748B", fontWeight: 500 }}>
            valuemap.kr
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}