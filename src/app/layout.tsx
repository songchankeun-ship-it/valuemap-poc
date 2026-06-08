import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://valuemap.kr"),
  title: {
    default: "밸류맵 — 한국 테마주 분석 도구",
    template: "%s",
  },
  description:
    "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
  openGraph: {
    title: "밸류맵 — 한국 테마주 분석 도구",
    description: "138개 종목 · 자체 지표 4종 · DART 공시 신호. 한국 테마주 분석을 한 화면에서.",
    url: "https://valuemap.kr",
    siteName: "밸류맵",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "밸류맵 — 한국 테마주 분석 도구",
    description: "138개 종목 · 자체 지표 4종 · DART 공시 신호",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-zinc-900 antialiased">
        <AppHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6">{children}</div>
          </main>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}