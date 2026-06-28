/**
 * 데이터 오류 신고 진입점 (서버 래퍼).
 * mailto·신고 필드·기준일/산식 라벨을 로케일별로 dataStatus 단일 소스에서 만들어
 * 클라이언트 표시부(ReportDataIssueContent)에 직렬화 props로 넘긴다.
 * /status·/about 등 여러 진입점이 같은 정의(메일 주소·본문·필드)를 공유한다.
 */
import {
  buildDataIssueMailto,
  dataIssueReportFieldsByLocale,
  dataStatusByLocale,
} from "@/lib/dataStatus";
import { ReportDataIssueContent } from "./ReportDataIssueContent";

export function ReportDataIssue({
  prefill,
  subject,
  className = "",
}: {
  prefill?: string;
  subject?: string;
  className?: string;
}) {
  const mailtoByLocale = {
    ko: buildDataIssueMailto({ prefill, subject, locale: "ko" }),
    en: buildDataIssueMailto({ prefill, subject, locale: "en" }),
  };
  const asOfLabelByLocale = {
    ko: dataStatusByLocale.ko.globalAsOfLabel,
    en: dataStatusByLocale.en.globalAsOfLabel,
  };
  const versionLabelByLocale = {
    ko: dataStatusByLocale.ko.metricsVersionLabel,
    en: dataStatusByLocale.en.metricsVersionLabel,
  };
  return (
    <ReportDataIssueContent
      mailtoByLocale={mailtoByLocale}
      fieldsByLocale={dataIssueReportFieldsByLocale}
      asOfLabelByLocale={asOfLabelByLocale}
      versionLabelByLocale={versionLabelByLocale}
      className={className}
    />
  );
}
