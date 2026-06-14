import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { dataMetadata } from "@/lib/realStocks";

export const metadata: Metadata = {
  metadataBase: new URL("https://valuemap.kr"),
  title: {
    default: "밸류맵 스톡 — 한국 주식 탐색 도구",
    template: "%s",
  },
  description:
    "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
  openGraph: {
    title: "밸류맵 스톡 — 한국 주식 탐색 도구",
    description: "138개 종목 · 자체 지표 4종 · DART 공시 신호. 한국 테마주 분석을 한 화면에서.",
    url: "https://valuemap.kr",
    siteName: "밸류맵 스톡",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "밸류맵 스톡 — 한국 주식 탐색 도구",
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
      name: "밸류맵",
      url: "https://valuemap.kr",
      logo: "https://valuemap.kr/icon.png",
      description: "한국 테마주 데이터 분석 도구",
      foundingDate: "2026",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "밸류맵",
      url: "https://valuemap.kr",
      inLanguage: "ko-KR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://valuemap.kr/stocks?q={search_term_string}",
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
            <main className="flex-1 min-w-0">
              <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6">{children}</div>
              <footer className="max-w-5xl mx-auto px-3 md:px-4 pb-10 pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="tabular-nums">데이터 {dataMetadata.asOfBusinessDate} 장마감 스냅샷</span>
                <span>·</span>
                <span>산식 Metrics v2.3</span>
                {process.env.VERCEL_GIT_COMMIT_SHA ? (
                  <>
                    <span>·</span>
                    <span className="tabular-nums">코드 {process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}</span>
                  </>
                ) : null}
                <span>·</span>
                <span>밸류맵 스톡 — 투자 권유가 아닌 탐색 도구입니다</span>
                <span>·</span>
                <a href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300 underline">이용약관</a>
                <a href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300 underline">개인정보</a>
              </footer>
            </main>
          </div>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
