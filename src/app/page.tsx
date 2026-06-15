import Link from "next/link";
import { dataMetadata, realStockPool } from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import { Search, BarChart3, Megaphone, TrendingUp, Bell } from "lucide-react";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { getRecentSignals } from "@/lib/recentSignals";
import { FREE_COMPARE_LIMIT } from "@/lib/limits";
import { fmtWon } from "@/lib/format";
import { compositeOf } from "@/lib/score";

interface RecentSignal {
  signalType: string;
  signalLabel: string;
  strength: number;
  disclosure: {
    corp_name: string;
    stock_code: string;
    report_nm: string;
    rcept_no: string;
    rcept_dt: string;
  };
}

const SIGNAL_TONE: Record<string, string> = {
  treasury_buy: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  insider_buy: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  correction: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  single_contract: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900",
  capital_raise: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-900",
};

function pickTopSignals(n: number, all: RecentSignal[]): RecentSignal[] {
  // 종목별 최강 신호 1개씩만
  const byStock = new Map<string, RecentSignal>();
  for (const s of all) {
    const code = s.disclosure?.stock_code;
    if (!code) continue;
    const cur = byStock.get(code);
    if (!cur || s.strength > cur.strength) byStock.set(code, s);
  }
  return Array.from(byStock.values())
    .sort((a, b) => b.strength - a.strength)
    .slice(0, n);
}

// 캐시 갱신: 1시간 (정적 빌드 캐시가 너무 오래 안 갱신되는 문제 방지)
export const revalidate = 3600;

function pickTopStocks(n: number) {
  return [...realStockPool]
    .filter((s) => compositeOf(s) > 0 && !isSuspect(s))
    .sort((a, b) => compositeOf(b) - compositeOf(a))
    .slice(0, n);
}

function quickReason(s: { momentum: number; flow: number; value: number; vol: number }): string {
  const items = [
    { label: "추세", v: s.momentum },
    { label: "거래활성도", v: s.flow },
    { label: "밸류", v: s.value },
    { label: "변동성", v: s.vol },
  ];
  const strong = items.filter((x) => x.v >= 70).sort((a, b) => b.v - a.v);
  if (strong.length >= 2) return strong[0].label + "·" + strong[1].label + " 강세";
  if (strong.length === 1) return strong[0].label + " 강세";
  return "네 지표 균형";
}

// 데이터 기준일 — YYYYMMDD → MM.DD (요일)
function fmtBizDate(yyyymmdd?: string): string {
  if (yyyymmdd && /^\d{8}$/.test(yyyymmdd)) {
    const mo = yyyymmdd.slice(4, 6);
    const da = yyyymmdd.slice(6, 8);
    const d = new Date(Number(yyyymmdd.slice(0, 4)), Number(mo) - 1, Number(da));
    const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return mo + "." + da + " (" + w + ")";
  }
  return "최근 거래일";
}

export const metadata = {
  title: "오른스코어 — 한국 주식 탐색 도구 | 138개 종목 데이터 분석",
  description: "코스피·코스닥 138개 종목의 모멘텀·거래활성도·밸류에이션·변동성을 한 화면에서 비교하세요. PER·PBR·ROE·배당수익률·DART 공시 신호까지 — 종목 탐색 시간을 줄이는 데이터 도구.",
  keywords: ["한국주식", "테마주", "종목분석", "코스피", "코스닥", "PER", "PBR", "ROE", "배당주", "공시", "DART", "퀀트", "밸류에이션", "모멘텀"],
  authors: [{ name: "필로소디" }],
  openGraph: {
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목의 모멘텀·거래활성도·밸류에이션·변동성·공시 신호를 한 화면에서. 종목 탐색 시간을 데이터로 줄여드립니다.",
    url: "https://ornscore.com",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목의 4대 지표 · 공시 신호를 한 화면에서. 종목 탐색을 데이터로 좁혀보세요.",
  },
  alternates: {
    canonical: "https://ornscore.com",
  },
};

export default async function HomePage() {
  const recentSig = await getRecentSignals(7);
  const universeTickers = new Set(realStockPool.map((x) => x.ticker));
  const top5 = pickTopStocks(5);
  const topSignals = pickTopSignals(2, (recentSig.signals as unknown as RecentSignal[]) ?? []);
  const dataAsOf = fmtBizDate(dataMetadata.asOfBusinessDate);

  // 오늘의 데이터 요약 통계
  const strongCount = realStockPool.filter((s) => compositeOf(s) >= 80).length;
  const upCount = realStockPool.filter((s) => s.changePct > 0).length;
  const signalCount = (recentSig.signals ?? []).length;

  return (
    <div className="space-y-4 md:space-y-7">
      <WelcomeOnboarding />

      {/* ── 히어로 (컴팩트) ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-zinc-200 dark:border-zinc-800 p-5 md:p-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center text-[10px] font-semibold tracking-wide text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full bg-white/70 dark:bg-zinc-900/60">
            오른스코어 · 베타
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="tabular-nums">{dataAsOf} 장마감</span>
          </span>
        </div>
        <h1 className="text-[22px] leading-tight md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          오늘 먼저 볼 종목을{" "}
          <span className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">데이터로 좁혀</span>보세요.
        </h1>
        <p className="text-[13px] md:text-base text-zinc-600 dark:text-zinc-300 mt-3 max-w-xl leading-relaxed">
          가격 흐름 · 거래량 · 밸류 · 변동성을 함께 분석해 먼저 확인할 <strong>후보</strong>를 정리합니다.
        </p>
        <div className="flex gap-2 mt-4">
          <Link href="/today" className="flex-1 sm:flex-none text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm">
            오늘의 후보 보기 →
          </Link>
          <Link href="/guide/metrics" className="flex-1 sm:flex-none text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition">
            지표 설명
          </Link>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3">
          ⚠ 투자 추천이 아닌, 종목 탐색 시간을 줄이는 데이터 도구입니다.
        </p>
      </section>

      {/* ── 오늘의 데이터 (첫 화면 스냅샷) ── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">오늘의 데이터</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate tabular-nums">{dataAsOf} 장마감 · {dataMetadata.count}종목</p>
            </div>
          </div>
          <Link href="/today" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium whitespace-nowrap shrink-0">
            전체 →
          </Link>
        </div>

        {/* 통계 3칸 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2.5 text-center">
            <div className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-400 tabular-nums leading-none">{strongCount}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">종합 80+ 종목</div>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
            <div className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400 tabular-nums leading-none">
              {upCount}<span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">/{realStockPool.length}</span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">최근 거래일 상승</div>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center">
            <div className="text-lg md:text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums leading-none">{signalCount}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">최근 공시 신호</div>
          </div>
        </div>

        {/* Top5 후보 리스트 */}
        {top5.length > 0 ? (
          <>
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 px-0.5">
              오늘 추가 확인 후보 <span className="font-normal text-zinc-400 dark:text-zinc-500">· 종합점수 상위</span>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {top5.map((s, i) => (
                <li key={s.ticker}>
                  <Link
                    href={"/stock/" + s.ticker}
                    className="flex items-center gap-2.5 py-2.5 -mx-1 px-1 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-blue-50 dark:active:bg-blue-950/30 transition"
                  >
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 w-4 text-center shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
                        {(s.returns?.r3m ?? 0) >= 80 ? (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium shrink-0 whitespace-nowrap tabular-nums">3개월 +{Math.round(s.returns?.r3m ?? 0)}%</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] min-w-0">
                        <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">{fmtWon(s.currentPrice)}</span>
                        <span className={"tabular-nums shrink-0 " + (s.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                          {s.changePct >= 0 ? "▲" : "▼"}{Math.abs(s.changePct).toFixed(2)}%
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500 truncate">· 💡 {quickReason(s)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 w-9">
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums leading-none">{Math.round(compositeOf(s))}</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">종합</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5">
              {dataMetadata.count}개 종목 중 종합 점수 상위 · 검증 보류 종목 제외
            </p>
          </>
        ) : null}
      </section>

      {/* ── 오늘 먼저 볼 공시 신호 (컴팩트) ── */}
      {topSignals.length > 0 ? (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">오늘 먼저 볼 공시 신호</h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">DART에서 자동 분류 · 클릭해서 종목 보기</p>
              </div>
            </div>
            <Link href="/disclosures" className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium whitespace-nowrap shrink-0">
              전체 →
            </Link>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topSignals.map((s) => {
              const code = s.disclosure.stock_code;
              const inUniv = universeTickers.has(code);
              const dartUrl = `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${s.disclosure.rcept_no}`;
              const date = s.disclosure.rcept_dt;
              const fmtDate = date.length === 8 ? `${date.slice(4, 6)}.${date.slice(6, 8)}` : date;
              const cardClass = "block bg-white/80 dark:bg-zinc-900/60 border border-amber-100 dark:border-amber-900/50 rounded-lg p-3 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-white dark:hover:bg-zinc-900 transition active:bg-amber-50 dark:active:bg-amber-950/40";
              const inner = (
                <>
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[s.signalType] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
                      {s.signalLabel}
                    </span>
                    {!inUniv ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500">분석 대상 외 ↗</span> : null}
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums ml-auto">{fmtDate}</span>
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {s.disclosure.corp_name}
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-snug">
                    {s.disclosure.report_nm}
                  </div>
                </>
              );
              return inUniv ? (
                <li key={s.disclosure.rcept_no}><Link href={"/stock/" + code} className={cardClass}>{inner}</Link></li>
              ) : (
                <li key={s.disclosure.rcept_no}><a href={dartUrl} target="_blank" rel="noopener noreferrer" className={cardClass}>{inner}</a></li>
              );
            })}
          </ul>

          <p className="text-[10px] text-amber-800/80 dark:text-amber-400/70 mt-2.5 leading-relaxed">
            ⚠ 숫자는 '분류 신뢰도'이며 호재/악재 점수가 아닙니다. 보유 변동의 매수·매도 방향은 본문에서 확인하세요.
          </p>
        </section>
      ) : null}

      {/* ── 기능 진입 3카드 ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/stocks" className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-700 transition">
          <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">종목 탐색</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">{dataMetadata.count}개 종목을 자체 지표 4종으로 정렬·필터링</div>
        </Link>
        <Link href="/compare" className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-700 transition">
          <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">종목 비교</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">관심 종목 {FREE_COMPARE_LIMIT}개까지 PER·PBR·ROE 나란히</div>
        </Link>
        <Link href="/disclosures" className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-700 transition">
          <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
            <Megaphone className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">공시 신호</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">DART 5종 신호 자동 분류 (자기주식·보유변동·정정·계약·자금조달)</div>
        </Link>
      </section>

      {/* ── 백테스트 CTA ── */}
      <section className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-800 dark:border-zinc-700 rounded-xl p-4 md:p-5 flex items-center justify-between text-white gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs font-medium text-blue-300 mb-1 uppercase tracking-wider">실데이터 검증</div>
          <div className="text-base font-semibold">가격 기반 전략 5년 백테스트</div>
          <div className="text-xs text-zinc-400 mt-0.5">가격 기반 4개 전략의 수익률·위험을 5년 데이터로. 현재 종합점수 성과 검증과는 다릅니다.</div>
        </div>
        <Link href="/backtest" className="px-4 py-2.5 min-h-[44px] inline-flex items-center bg-white text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-100 active:bg-zinc-200 transition shrink-0">
          백테스트 보기 →
        </Link>
      </section>

      {/* ── 왜 오른스코어 + 분석 대상 & 한계 ── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">왜 오른스코어인가</div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            한 종목을 PER만 보고 판단하는 시대는 끝났습니다. KRX 일별 종가, Naver Finance 재무, DART 공시까지 통합해 <strong className="text-zinc-900 dark:text-zinc-100">추세 · 거래활성도 · 밸류 · 위험조정</strong> 네 지표로 종목을 입체적으로 봅니다. 점수가 어떻게 계산되는지 <Link href="/guide/metrics" className="text-blue-700 dark:text-blue-400 underline">전부 공개</Link>되어 있고, 출처와 계산 근거를 확인할 수 있는 데이터만 사용합니다.
          </p>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">분석 대상 & 한계</div>
          <dl className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">왜 {dataMetadata.count}개 종목인가요?</dt>
              <dd>코스피·코스닥 시가총액 상위 + 거래 활발 + 테마 대표 종목 {dataMetadata.count}개. 풀이 너무 크면 신호의 의미가 흐려져서 의도적으로 좁혔습니다.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">데이터는 얼마나 자주 갱신되나요?</dt>
              <dd>매일 장 마감 후 자동 갱신 (주말·공휴일은 직전 영업일 데이터). 데이터 기준일은 상단에 표시됩니다.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">지표 점수의 한계는?</dt>
              <dd>네 지표는 모두 <strong className="text-zinc-900 dark:text-zinc-100">과거 데이터 기반</strong>입니다. 점수가 높다고 미래 수익을 보장하지 않으며, 점수가 낮아도 회복 구간일 수 있습니다. 항상 원문 공시·재무를 함께 확인하세요.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">투자 조언인가요?</dt>
              <dd>아닙니다. 오른스코어는 <strong className="text-zinc-900 dark:text-zinc-100">탐색 우선순위</strong>를 정하는 분석 도구입니다. 매수·매도 결정은 본인 책임입니다.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <strong className="text-zinc-700 dark:text-zinc-300">데이터 출처:</strong> KRX 일별 종가 (FinanceDataReader), Naver Finance PER/PBR/ROE, yfinance 보조 지표, DART 공시 실데이터. {dataMetadata.count}개 종목 · 매일 갱신.
        <div className="mt-3 flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
          <Link href="/about" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">서비스 소개</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">이용약관</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">개인정보처리방침</Link>
        </div>
      </section>
    </div>
  );
}
