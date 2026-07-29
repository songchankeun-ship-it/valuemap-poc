import Link from "next/link";
import { dataMetadata, formatBizDateLong } from "@/lib/realStocks";
import { Mail, Database, Code, AlertTriangle, Smartphone } from "lucide-react";
import PwaInstallHelper from "@/components/PwaInstallHelper";
import { brandKeywords, stockDiscoveryKeywords, trustKeywords, uniqueKeywords } from "@/lib/seoKeywords";

export const metadata = {
  title: "오른스코어 소개 — 한국 주식 탐색 도구",
  description: "오른스코어는 한국 주식 스크리닝, 종목 검색, PER·PBR·ROE 지표, DART 공시 신호를 함께 보는 데이터 탐색 도구입니다.",
  keywords: uniqueKeywords(brandKeywords, stockDiscoveryKeywords, trustKeywords),
  openGraph: {
    title: "오른스코어 소개 — 한국 주식 탐색 도구",
    description: "한국 주식 스크리닝, 종목 검색, 지표 비교, DART 공시 신호를 함께 보는 데이터 탐색 도구입니다.",
    url: "/about",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
    images: ["/social/ornscore-og-1200x630.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "오른스코어 소개 — 한국 주식 탐색 도구",
    description: "한국 주식 스크리닝, 종목 검색, 지표 비교, DART 공시 신호를 함께 보는 데이터 탐색 도구입니다.",
  },
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const dataAsOf = formatBizDateLong(dataMetadata.asOfBusinessDate);

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-10 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">서비스 소개</h1>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          오른스코어는 한국 개인 투자자가 <strong className="text-zinc-900 dark:text-zinc-100">&quot;오늘 어떤 종목부터 봐야 할지&quot;</strong>를 데이터로 빠르게 좁히는 분석 도구입니다.
        </p>
        <div className="mt-3 inline-flex items-center border-l-2 border-blue-500 bg-blue-50 px-3 py-2 text-xs font-semibold tabular-nums text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          데이터 기준 {dataAsOf} 장마감
        </div>
      </header>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">왜 만들었나요?</h2>
        <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <p>
            한국 주식 시장에는 약 2,500개 이상의 상장 종목이 있습니다. 매일 모든 종목을 일일이 분석하는 건 현실적으로 불가능합니다.
          </p>
          <p>
            대부분의 개인 투자자는 종목 후보를 좁히는 데 시간을 가장 많이 씁니다. PER만 보면 다른 지표를 놓치고, 모멘텀만 보면 고평가 위험을 놓칩니다. 그래서 <strong className="text-zinc-900 dark:text-zinc-100">한 종목을 여러 각도로 동시에 보는 도구</strong>가 필요했습니다.
          </p>
          <p>
            오른스코어는 <strong>추세(최근 흐름) · 거래활성도(관심 증가) · 밸류(가격 부담) · 위험조정(출렁임 대비 효율)</strong> 네 지표로 종목을 입체적으로 봅니다. 위험조정은 안전 점수가 아니라 과거 수익 대비 출렁임의 효율을 비교한 값입니다. 각 점수는 공개된 산식으로 계산되며, 어떤 데이터로 어떻게 만들어졌는지 모두 투명하게 공개합니다.
          </p>
        </div>
      </section>

      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">오른스코어는 투자 추천이 아닙니다</h2>
        </div>
        <div className="space-y-2 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          <p>
            본 서비스는 <strong>투자 추천, 매수·매도 권유, 투자자문을 제공하지 않습니다.</strong> 제공되는 정보는 공개 데이터와 자체 계산 기준에 따른 참고 자료이며, 실제 투자 판단과 그 결과에 대한 책임은 사용자 본인에게 있습니다.
          </p>
          <p>
            점수가 높은 종목이 반드시 좋은 종목이라는 의미가 아닙니다. 점수는 과거 데이터 기반의 <strong>탐색 우선순위</strong>를 의미하며, 미래 수익을 보장하지 않습니다.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">데이터 출처와 갱신 주기</h2>
        </div>
        <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>일별 가격·거래량</strong> — KRX 상장 종목 · Naver Finance 전달 · FinanceDataReader(NaverDailyReader) 수집 · 권리 검토 중</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>재무 지표</strong> — Naver Finance HTML 기반 PER · PBR · ROE · 배당수익률 · 권리 검토 중</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>보조 필드</strong> — Yahoo Finance 전달 · yfinance 기반 배당수익률·베타·PEG · 권리 검토 중</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span><strong>Open DART 공식 API</strong> — 공시 원문과 자기주식·임원·주요주주 보유변동·정정·계약·자금조달 분류</span>
          </li>
        </ul>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          출처 표시는 이용·재배포 허가를 뜻하지 않습니다. 권리 검토 중인 소스는 기존 무료 베타 범위를 확대하지 않으며, 이 페이지와 상단 상태 바는 같은 공통 데이터 기준일을 표시합니다.
        </p>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">분석 대상 & 산식</h2>
        </div>
        <dl className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <div>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">분석 종목</dt>
            <dd>코스피·코스닥 시가총액 상위 + 거래 활발 + 테마 대표 {dataMetadata.count}개 종목. 베타 기간 동안 데이터 품질이 검증된 대표 종목부터 제공하며, 유니버스는 점진적으로 확대할 예정입니다. 순위는 모두 이 분석 대상 {dataMetadata.count}종목 내 순위입니다.</dd>
            <dd className="mt-2"><Link href="/universe" className="text-blue-700 dark:text-blue-400 hover:underline font-medium">→ 분석 대상 전체 목록·선정 기준·데이터 한계 보기</Link></dd>
            <dd className="mt-1"><Link href="/status" className="text-blue-700 dark:text-blue-400 hover:underline font-medium">→ 데이터 상태·신선도·소스 보기</Link></dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">점수 산식</dt>
            <dd>각 지표의 계산식과 가중치는 <Link href="/guide/metrics" className="text-blue-600 dark:text-blue-400 underline">지표 가이드</Link>에 전부 공개되어 있습니다.</dd>
          </div>
          <div>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">데이터 한계</dt>
            <dd>모든 지표는 과거 데이터 기반입니다. 미래 수익을 보장하지 않으며, 점수가 낮아도 회복 구간일 수 있습니다.</dd>
          </div>
        </dl>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">앱처럼 설치하기</h2>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
          오른스코어는 웹앱(PWA)이라 별도 설치 없이 브라우저에서 바로 쓸 수 있고, 원하면 홈 화면에 추가해 앱처럼 전체 화면으로 실행할 수 있습니다.
        </p>
        <PwaInstallHelper />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
          점수·시세·공시는 항상 최신 데이터를 불러오므로 실행 시 인터넷 연결이 필요합니다. 연결이 끊기면 <Link href="/offline" className="text-blue-600 dark:text-blue-400 underline">안내 화면</Link>이 표시됩니다. 현재는 웹앱(PWA)으로 먼저 제공하며, 앱 마켓 출시는 별도 검토·준비 중입니다.
        </p>
      </section>

      <section className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">문의 & 오류 제보</h2>
        </div>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">데이터 오류</strong>는{" "}
            <Link href="/status#report" className="text-blue-600 dark:text-blue-400 underline">데이터 상태 페이지의 오류 신고</Link>
            에서 포함할 정보를 보고 보내주시면 확인이 빠릅니다.
          </p>
          <p>기능 제안·협업 문의는 아래로 연락해주세요:</p>
          <p className="font-mono text-zinc-900 dark:text-zinc-100">
            <a href="mailto:contact@ornscore.com" className="text-blue-600 dark:text-blue-400 underline">contact@ornscore.com</a>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            운영: 오른스코어 운영팀 · 한국 개인 투자자를 위한 사이드 프로젝트로 시작되었습니다.
          </p>
        </div>
      </section>

      <section className="text-xs text-zinc-500 dark:text-zinc-400 text-center border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">이용약관</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">개인정보처리방침</Link>
        <span className="mx-2">·</span>
        <Link href="/guide/metrics" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">지표 가이드</Link>
      </section>
    </div>
  );
}
