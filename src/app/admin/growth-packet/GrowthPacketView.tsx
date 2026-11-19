"use client";

import { useState } from "react";
import type { readGrowthPacketEvidence } from "@/lib/growthAggregateReport";
import { PACKET_FORMATS, type GrowthPacket } from "@/lib/growthPacket";
import { growthPacketDecision } from "@/lib/growthPacketDecision";

type Evidence = Awaited<ReturnType<typeof readGrowthPacketEvidence>>;

function copyWithSelection(text: string, button: HTMLButtonElement) {
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.append(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    button.focus({ preventScroll: true });
  }
}

function CopyDraft({ text }: { text: string }) {
  const [status, setStatus] = useState("");
  async function copy(button: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("복사 완료");
    } catch {
      setStatus(copyWithSelection(text, button) ? "복사 완료" : "텍스트를 선택해 복사해 주세요.");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={(event) => void copy(event.currentTarget)} className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm font-medium dark:border-zinc-700">
        초안 복사
      </button>
      <span role="status" className="text-sm">{status}</span>
    </div>
  );
}

export function GrowthPacketView({ packet, evidence }: { packet: GrowthPacket; evidence: Evidence }) {
  const [uses, setUses] = useState<Record<string, number>>({});
  const [coverageConfirmed, setCoverageConfirmed] = useState(false);
  const counts = evidence.status === "ready" ? evidence : undefined;
  const cell = "px-2 py-2 text-left align-middle [overflow-wrap:anywhere]";

  return (
    <>
      <header className="mt-3 space-y-1">
        <h1 className="text-2xl font-bold">성장 콘텐츠 패킷</h1>
        <p className="text-sm">데이터 기준 {packet.asOfBusinessDate} · Metrics {packet.metricsVersion} · 전체 {packet.universeCount}종목</p>
        <p className="text-sm">후보 범위 · 비교 {packet.coverage.comparisonPairs}쌍 · PER/ROE {packet.coverage.lowPerStocks}종목 · 오늘의 거래량 {packet.coverage.activityStocks}종목</p>
      </header>

      <section className="my-5 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">14일 운영 판단</h2>
        <p className="text-xs">{evidence.from} ~ {evidence.through} KST · 오늘 진행분 포함</p>
        <p className="text-sm">수집을 확인한 뒤 14일 동안 같은 형식을 두 번 이상 게시하고 진입이 0건이면 중단합니다. 같은 형식의 게시 횟수가 1회 이상이고 진입과 후속 행동이 모두 측정되면 확대합니다.</p>
        <p className="text-sm">진입은 Threads 캠페인과 도착 화면 유형별 이벤트 수입니다. 후속 행동은 비교 화면 열기, 주제에서 상세 열기, 검토한 거래량 후보의 관심종목 저장을 형식별로 살펴봅니다. 관심종목 집계에는 저장과 해제가 모두 포함됩니다. 같은 유형의 다른 Threads 링크나 행동도 집계에 포함될 수 있습니다.</p>
        {counts ? (
          <label className="flex items-start gap-2 text-sm">
            <input className="mt-1" type="checkbox" checked={coverageConfirmed} onChange={(event) => setCoverageConfirmed(event.target.checked)} />
            사용 기간 전체의 수집과 같은 유형의 다른 링크 사용 여부를 확인했습니다.
          </label>
        ) : (
          <p className="text-sm" role="status">{evidence.status === "not_configured" ? "집계가 연결되면 측정값을 표시합니다." : "집계를 읽을 수 없습니다."}</p>
        )}
        <table aria-label="형식별 운영 판단" className="w-full table-fixed border-collapse text-sm">
          <thead><tr className="border-b border-zinc-300 dark:border-zinc-700">
            <th scope="col" className={`${cell} w-[31%]`}>형식</th>
            <th scope="col" className={`${cell} w-[18%]`}>사용</th>
            <th scope="col" className={`${cell} w-[18%]`}>진입</th>
            <th scope="col" className={`${cell} w-[16%]`}>후속</th>
            <th scope="col" className={cell}>판단</th>
          </tr></thead>
          <tbody>
            {PACKET_FORMATS.map((format) => {
              const entries = counts?.entries[format.id];
              const downstream = counts?.downstream[format.id];
              return (
                <tr key={format.id} className="border-b border-zinc-200 last:border-0 dark:border-zinc-800">
                  <th scope="row" className={`${cell} font-medium`}>{format.label}</th>
                  <td className={cell}>
                    <input aria-label={`${format.label} 사용 횟수`} type="number" min="0" step="1" inputMode="numeric"
                      value={uses[format.id] ?? ""}
                      onChange={(event) => {
                        const value = event.target.valueAsNumber;
                        setUses((previous) => ({ ...previous, [format.id]: Number.isSafeInteger(value) && value > 0 ? value : 0 }));
                      }}
                      className="w-full max-w-16 rounded-md border border-zinc-300 bg-transparent p-1 dark:border-zinc-700" />
                  </td>
                  <td className={cell}>{entries ?? "—"}</td>
                  <td className={cell}>{downstream ?? "—"}</td>
                  <td className={cell}>{growthPacketDecision(uses[format.id] ?? 0, coverageConfirmed ? entries : undefined, downstream)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs">사용 횟수는 이 화면에서 직접 입력하며 페이지를 새로 열면 초기화됩니다.</p>
      </section>

      {PACKET_FORMATS.map((format) => (
        <section key={format.id} className="mb-5">
          <h2 className="mb-2 text-lg font-semibold">{format.label}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {packet.drafts.filter((draft) => draft.format === format.id).map((draft) => (
              <article key={draft.id} data-growth-draft={draft.id} className="min-w-0 space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="text-sm font-medium">확인할 행동 · {draft.action}</p>
                <p className="select-text whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{draft.text}</p>
                <CopyDraft text={draft.text} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
