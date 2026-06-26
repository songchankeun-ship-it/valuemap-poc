import Link from "next/link";
import { DisclosureSignalCard, type DisclosureSignalVM } from "./DisclosureSignalCard";

// 오늘 먼저 볼 공시 신호 섹션 — 분류 신뢰도 고지 포함.
export function DisclosureSignalSection({ signals }: { signals: DisclosureSignalVM[] }) {
  if (signals.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">오늘 먼저 볼 공시 신호</h2>
        <Link prefetch={false} href="/disclosures" className="text-[12px] font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
          전체 보기 →
        </Link>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
        자기주식, 보유 변동, 정정공시, 계약, 자금조달 관련 공시를 <strong className="font-medium text-zinc-600 dark:text-zinc-300">DART 최신 200건 내</strong>에서 자동 분류해 확인할 신호를 정리합니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {signals.map((s) => (
          <DisclosureSignalCard key={s.rceptNo} s={s} />
        ))}
      </div>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        공시 신호의 숫자는 호재/악재 점수가 아니라 분류 신뢰도입니다. 실제 영향은 원문 공시에서 직접 확인해야 합니다.
      </p>
    </section>
  );
}
