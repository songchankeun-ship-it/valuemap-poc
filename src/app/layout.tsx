import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "밸류맵 — 한국 테마주 분석 도구",
    template: "%s",
  },
  description: "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
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
            <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}