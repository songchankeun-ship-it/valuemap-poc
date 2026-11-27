"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { priorityScoreCardCopy } from "@/lib/copy/stockDetail";
import { financialEvidenceCopy, type ValuationBasis } from "@/lib/financialEvidence";

export interface PrioritySignal {
  label: string;
  score: number;
}

export function PriorityScoreCard({
  score,
  overallRank,
  overallTieCount = 1,
  poolN,
  sectorRank,
  sectorTieCount = 1,
  sectorCount,
  sector,
  completeness,
  metricsVersion,
  valuationBasis,
  suspect,
  leadStrength,
  leadCheck,
}: {
  score: number;
  overallRank: number;
  overallTieCount?: number;
  poolN: number;
  sectorRank: number;
  sectorTieCount?: number;
  sectorCount: number;
  sector: string;
  completeness: number;
  metricsVersion?: string | null;
  valuationBasis: ValuationBasis;
  suspect: boolean;
  leadStrength: PrioritySignal;
  leadCheck: PrioritySignal;
}) {
  const { locale } = useLanguage();
  const t = priorityScoreCardCopy[locale];
  const rankPrefix = (tieCount: number) => tieCount > 1 ? (locale === "ko" ? "공동 " : "T-") : "";
  return (
    <div className="research-stock-score" data-suspect={suspect}>
      <h2>{t.title}</h2>
      <div className="research-stock-score-value">
        <strong>{score}</strong>
        <span>/ 100</span>
        {suspect ? <AlertTriangle size={16} aria-hidden="true" /> : null}
      </div>
      {valuationBasis === "three-factors" ? (
        <p className="text-xs leading-relaxed">{financialEvidenceCopy[locale].threeFactors}</p>
      ) : null}

      <dl className="research-stock-ranks">
        <div>
          <dt>{t.overallPrefix}</dt>
          <dd>{rankPrefix(overallTieCount)}{overallRank}<small> / {poolN}{t.rankSuffix}</small></dd>
        </div>
        <div>
          <dt>{sector}</dt>
          <dd>{rankPrefix(sectorTieCount)}{sectorRank}<small> / {sectorCount}{t.rankSuffix}</small></dd>
        </div>
      </dl>
      <details className="research-stock-rank-help group">
        <summary>
          {t.rankNoteToggle}
          <ChevronDown size={14} className="group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p>{t.scopeNote(poolN)}</p>
        <p>{t.scoreVsRankNote(poolN)}</p>
      </details>

      <dl className="research-stock-score-signals">
        {[{ title: t.leadStrength, signal: leadStrength }, { title: t.leadCheck, signal: leadCheck }].map(({ title, signal }, index) => (
          <div key={title} data-tone={index === 1 ? "check" : "strength"}>
            <dt>
              <span>{title}</span>
              <strong>{signal.label}</strong>
              <small>{t.metricAlias(signal.label)}</small>
            </dt>
            <dd>{Math.round(signal.score)}</dd>
          </div>
        ))}
      </dl>
      <p className="research-stock-risk">{t.riskMeaning}</p>
      <div className="research-stock-trust">
        <h3>{t.trustLabel}</h3>
        <ul aria-label={t.badgeAriaLabel}>
          <li>{t.requiredDataPrefix} {completeness}%</li>
          <li>{suspect ? t.suspectPill : t.passPill}</li>
          {metricsVersion ? <li>{metricsVersion}</li> : null}
        </ul>
        <p>{t.completenessNote}</p>
      </div>
    </div>
  );
}
