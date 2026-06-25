/**
 * 데이터 오류 신고 진입점 (서버 컴포넌트, 순수 프레젠테이션).
 * mailto 버튼과 "신고 시 포함할 정보" 체크리스트를 dataStatus 단일 소스에서 읽어 렌더한다.
 * /status·/about 등 여러 진입점이 같은 정의(메일 주소·본문·필드)를 공유한다.
 */
import {
  buildDataIssueMailto,
  dataIssueReportFields,
  dataStatus,
} from "@/lib/dataStatus";

export function ReportDataIssue({
  prefill,
  subject,
  className = "",
}: {
  prefill?: string;
  subject?: string;
  className?: string;
}) {
  const mailto = buildDataIssueMailto({ prefill, subject });
  return (
    <section
      id="report"
      className={
        "scroll-mt-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 " +
        className
      }
    >
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">데이터 오류 신고</div>
      <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
        가격·재무·공시·점수에서 잘못된 값이나 분류 오류를 발견하면 알려주세요. 아래 정보를 함께 적어주시면 확인이 빠릅니다.
      </p>

      <ul className="mt-3 space-y-1.5 text-[12px] text-zinc-700 dark:text-zinc-300">
        {dataIssueReportFields.map((f) => (
          <li key={f.label} className="flex gap-2 min-w-0">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0" aria-hidden="true">•</span>
            <span className="min-w-0 break-words">
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">{f.label}</strong>
              <span className="text-zinc-500 dark:text-zinc-400"> — {f.hint}</span>
            </span>
          </li>
        ))}
      </ul>

      <a
        href={mailto}
        className="inline-flex items-center mt-3 min-h-[44px] px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
      >
        데이터 오류 신고하기
      </a>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
        메일 본문에 현재 데이터 기준일({dataStatus.globalAsOfLabel})·산식({dataStatus.metricsVersionLabel})이 자동으로 채워집니다.
        오류 신고 저장소·관리자 대시보드·수동 재수집은 후속 과제이며, 현재는 메일로 접수합니다. 자세한 범위는{" "}
        <code className="text-[10px]">docs/legal-ai-commercial-readiness.md</code> 참고.
      </p>
    </section>
  );
}
