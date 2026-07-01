import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { LanguageProvider } from "@/components/LanguageProvider";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { dataStatus } from "@/lib/dataStatus";

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
  // Task 74: PNG 아이콘 연결. Next는 public/ 에셋을 자동으로 head에 넣지 않으므로
  // 여기서 명시해 iOS 홈 화면용 apple-touch-icon(180px) <link>가 방출되게 한다.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // iOS 홈 화면 설치(standalone) 시 상태바 스타일과 앱 제목. capable=true 로
  // 사파리 '홈 화면에 추가' 시 전체화면 웹앱처럼 실행되고, black-translucent 로
  // 노치/상태바 영역까지 콘텐츠가 채워지도록 한다(safe-area 패딩과 함께 사용).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "오른스코어",
  },
};

// Next 14 viewport export. themeColor 는 <meta name="theme-color"> 로 방출되어
// 설치형 PWA/모바일 브라우저 UI 색을 라이트/다크에 맞춰 준다.
// viewportFit:"cover" 는 노치 기기에서 env(safe-area-inset-*) 값을 활성화한다.
// 접근성을 위해 maximumScale/userScalable 은 설정하지 않는다(확대 허용).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// 사이트 전체 Organization + WebSite 구조화 데이터
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "오른스코어",
      url: "https://ornscore.com",
      logo: "https://ornscore.com/icon-512.png",
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
        {/* Pretendard 웹폰트 — 비차단 로드(JS 주입 방식).
         * SSR 마크업에는 스타일시트 링크를 넣지 않고, 아래 인라인 스크립트가
         * media="print" 로 link 를 만든 뒤 onload 시 media='all' 로 승격한다.
         * React 가 렌더하지 않은 노드라 하이드레이션 불일치(Prop media did not match)가
         * 발생하지 않으며, 오프라인/헤드리스에서 외부 CDN 이 멈춰도 시스템 한글 폰트
         * 폴백으로 즉시 렌더(및 스크린샷)된다. 프로덕션은 그대로 Pretendard 적용.
         * 추가로 자동화 브라우저(navigator.webdriver, 예: Playwright 스크린샷 게이트)에서는
         * (1) CDN 폰트 요청 자체를 생략하고, (2) sticky/fixed 헤더·하단바의 backdrop-filter(blur)
         * 와 무한 애니메이션(animate-pulse/spin)·transition 을 끄는 스타일을 주입한다.
         * 풀페이지 캡처 시 헤드리스 크로뮴이 blur 영역을 타일마다 재합성하면서
         * page.screenshot 이 'fonts loaded' 직후 30s 타임아웃되던 문제를 차단 —
         * Playwright 의 animations:'disabled' 도 backdrop-filter 는 못 끄므로 직접 무력화.
         * 실사용자(navigator.webdriver 미설정)는 blur·폰트·애니메이션 그대로 유지. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(navigator.webdriver){var s=document.createElement('style');s.textContent='*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important;}';document.head.appendChild(s);return;}var h='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';var l=document.createElement('link');l.rel='stylesheet';l.href=h;l.media='print';l.onload=function(){l.media='all';};document.head.appendChild(l);}catch(e){}})();",
          }}
        />
        <noscript>
          {/* JS 비활성 시에도 폰트를 적용 (차단되지만 안전한 폴백) */}
          {/* eslint-disable-next-line @next/next/no-css-tags */}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AppHeader />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 min-w-0 pb-[calc(4rem_+_env(safe-area-inset-bottom))] lg:pb-0">
                <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6">{children}</div>
                <AppFooter
                  globalAsOfLabel={dataStatus.globalAsOfLabel}
                  metricsVersionLabel={dataStatus.metricsVersionLabel}
                  dataStale={dataStatus.dataStale}
                  commitSha={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)}
                />
              </main>
            </div>
            <MobileBottomNav />
            {process.env.VERCEL ? (
              <>
                <Analytics />
                <SpeedInsights />
              </>
            ) : null}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
