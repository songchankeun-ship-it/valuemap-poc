import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { dataMetadata } from "@/lib/realStocks";

export const metadata: Metadata = {
  metadataBase: new URL("https://ornscore.com"),
  title: {
    default: "오른스코어 — 한국 주식 탐색 도구",
    template: "%s",
  },
  description:
    "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
  openGraph: {
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목 · 자체 지표 4종 · DART 공시 신호. 한국 주식 데이터 탐색을 한 화면에서.",
    url: "https://ornscore.com",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목 · 자체 지표 4종 · DART 공시 신호",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 사이트 전체 Organization + WebSite 구조화 데이터
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "오른스코어",
      url: "https://ornscore.com",
      logo: "https://ornscore.com/icon.png",
      description: "한국 테마주 데이터 분석 도구",
      foundingDate: "2026",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "오른스코어",
      url: "https://ornscore.com",
      inLanguage: "ko-KR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://ornscore.com/stocks?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeProvider>
          <AppHeader />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-16 lg:pb-0">
              <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6">{children}</div>
              <footer className="max-w-5xl mx-auto px-3 md:px-4 pb-10 pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="tabular-nums" title={process.env.VERCEL_GIT_COMMIT_SHA ? "코드 " + process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : undefined}>데이터 {dataMetadata.asOfBusinessDate} 장마감</span>
                <span>·</span>
                <span>산식 Metrics {dataMetadata.metricsVersion ?? "—"}</span>
                <span>·</span>
                {(() => {
                  const d = dataMetadata.asOfBusinessDate;
                  let stale = false;
                  if (d && /^\d{8}$/.test(d)) {
                    const dt = new Date(Number(d.slice(0, 4)), Number(d.slice(4, 6)) - 1, Number(d.slice(6, 8)));
                    stale = (Date.now() - dt.getTime()) / 86400000 > 5;
                  }
                  return (
                    <a href="/status" className={(stale ? "text-amber-600/90 dark:text-amber-500/90" : "text-emerald-600/80 dark:text-emerald-500/80") + " hover:underline"}>데이터 상태 {stale ? "갱신 지연 확인" : "정상"}</a>
                  );
                })()}
                <span>·</span>
                <span>오른스코어 — 투자 권유가 아닌 탐색 도구입니다</span>
                <span>·</span>
                <a href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300 underline">이용약관</a>
                <a href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300 underline">개인정보</a>
              </footer>
            </main>
          </div>
          <MobileBottomNav />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
