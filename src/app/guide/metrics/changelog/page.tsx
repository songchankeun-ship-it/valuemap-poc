import Link from "next/link";
import { dataStatus } from "@/lib/dataStatus";

export const metadata = {
  title: "산식 변경 이력 — 오른스코어",
  description: "오른스코어 지표 산식의 버전·적용일·변경 요약을 투명하게 기록합니다.",
};

export const revalidate = 3600;

/**
 * 산식 변경 이력 (설계서 §13). 현재 운영 버전과 적용일을 전역 dataStatus 단일 소스에서 읽는다.
 * 버전이 올라가면 이 목록 맨 위에 새 항목을 추가한다(스켈레톤 — 향후 변경 기록 위치).
 */
const CHANGELOG: {
  version: string;
  effectiveDate?: string;
  summary: string;
  details: string[];
  current?: boolean;
}[] = [
  {
    version: dataStatus.metricsVersionLabel,
    effectiveDate: dataStatus.metricsEffectiveDate,
    summary: "현재 운영 중인 산식 버전입니다.",
    details: [
      "추세·거래활성도·밸류·위험조정 4개 지표의 전체 풀 백분위 기준을 통일했습니다.",
      "결측·최소 관측치 미달 종목은 중립(50점)으로 처리하는 기준을 명확화했습니다.",
    ],
    current: true,
  },
];

export default function MetricsChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header className="space-y-1">
        <Link href="/guide/metrics" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">← 지표 가이드로</Link>
        <h1 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">산식 변경 이력</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          현재 운영 산식은 <strong className="text-zinc-900 dark:text-zinc-100">{dataStatus.metricsVersionLabel}</strong>
          {dataStatus.metricsEffectiveDate ? <> · 적용일 {dataStatus.metricsEffectiveDate}</> : null}
          입니다. 산식이 바뀌면 버전·적용일·변경 요약을 이 페이지에 기록합니다.
        </p>
      </header>

      <ol className="space-y-4">
        {CHANGELOG.map((c) => (
          <li
            key={c.version}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5"
          >
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{c.version}</span>
              {c.current ? (
                <span className="text-[11px] rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">현재 운영</span>
              ) : null}
              {c.effectiveDate ? (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">적용일 {c.effectiveDate}</span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2 leading-relaxed">{c.summary}</p>
            <ul className="list-none pl-0 space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {c.details.map((d, i) => (
                <li key={i}>· {d}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <section className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-1.5">
        <p>· 버전이 올라가면 이 목록 맨 위에 새 항목(버전·적용일·변경 요약·영향 지표)을 추가합니다.</p>
        <p>· 이전 버전 점수와 단순 비교하지 마세요. 산식이 바뀌면 일부 종목 점수가 변동될 수 있습니다.</p>
        <p>· 점수는 탐색 우선순위이며 미래 수익률을 의미하지 않습니다.</p>
      </section>
    </div>
  );
}
