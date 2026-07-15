import { CheckCircle2, MinusCircle } from "lucide-react";

/**
 * 검증 연구 범위 고지 (Slice M) — 현재 종합 점수에 대해 "지금 확인할 수 있는 것"과
 * "현재 데이터로 만들 수 없는 것"을 정직하게 분리해 보여준다.
 *
 * - 확인 가능(단면 방법론 감사): 지표 간 상관·종합 기여도·등가중 대안·단일지표 제거(ablation).
 *   모두 단일 시점 스냅샷의 "구조" 분석이지 성과(백테스트)가 아니다.
 * - 확인 불가(present data 로 산출 불가): 미래수익·거래비용·회전율·신뢰구간·업종중립·아웃오브샘플.
 *   추정으로 대체하지 않고 명시적으로 표시하지 않는다(scripts/methodology_audit.py 와 동일 계약).
 *
 * 서버 컴포넌트. 수치를 렌더링하지 않아(고정 문구) 결정적이며 stale 위험이 없다.
 * 로컬 재현: `python scripts/methodology_audit.py` → docs/methodology-audit.md.
 */
export function ValidationScopeNotice() {
  const canCheck = [
    "지표 간 상관 (추세·거래활성도·밸류·변동성조정이 서로 얼마나 겹치나)",
    "종합 점수 기여도 (등가중이라도 어떤 지표가 순위를 더 좌우하나)",
    "등가중 대안 (가중치를 바꾸면 순위가 얼마나 흔들리나)",
    "단일지표 제거 · ablation (한 지표를 빼면 순위가 얼마나 바뀌나)",
  ];
  const cannotCheck = [
    ["미래수익 (forward-return)", "다음 구간 수익률 스냅샷이 없어 산출 불가"],
    ["거래비용 (transaction cost)", "체결·수수료·슬리피지 모델이 없어 산출 불가"],
    ["회전율 (turnover)", "시점별 리밸런싱 시계열이 없어 산출 불가"],
    ["신뢰구간 (confidence interval)", "반복·시점 표본이 없어 표준오차 산출 불가"],
    ["업종중립 (sector-neutral)", "시점별 업종 수익률·노출이 없어 산출 불가"],
    ["아웃오브샘플 (out-of-sample)", "학습/검증 분리용 별도 시점 스냅샷이 없어 산출 불가"],
  ];

  return (
    <section
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
      aria-label="검증 연구 범위 — 확인 가능/불가"
    >
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">이 페이지로 현재 종합 점수를 검증하지는 않습니다</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        아래 “확인 가능” 항목은 현재 스냅샷의 <strong className="font-semibold text-zinc-700 dark:text-zinc-300">지표 구조를 단면(cross-sectional)으로</strong> 본 것이며,
        성과(수익률) 검증이 아닙니다. “확인 불가” 항목은 현재 데이터로 만들 수 없어 <strong className="font-semibold text-zinc-700 dark:text-zinc-300">추정으로 대체하지 않고</strong> 표시하지 않습니다.
      </p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/60 dark:bg-emerald-950/25 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">지금 확인할 수 있는 것 · 단면 방법론 감사</h4>
          </div>
          <ul className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {canCheck.map((t) => (
              <li key={t} className="flex gap-1.5">
                <span className="text-emerald-500 dark:text-emerald-400 shrink-0" aria-hidden="true">•</span>
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            로컬 재현: <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-800">python scripts/methodology_audit.py</code> → <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-800">docs/methodology-audit.md</code>
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MinusCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">현재 데이터로 확인할 수 없는 것</h4>
          </div>
          <ul className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {cannotCheck.map(([head, why]) => (
              <li key={head} className="flex gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500 shrink-0" aria-hidden="true">·</span>
                <span className="min-w-0">
                  <strong className="font-medium text-zinc-700 dark:text-zinc-300">{head}</strong> — {why}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
