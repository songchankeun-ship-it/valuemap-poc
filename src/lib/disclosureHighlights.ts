const PRIORITY_TYPES = new Set(["capital_raise", "single_contract", "correction"]);

export function dartFilingUrl(receipt: string): string | undefined {
  if (!/^\d{14}$/.test(receipt)) return undefined;
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${receipt}`;
}

interface HighlightCandidate {
  signalType: string;
  rcept_dt_latest: string;
  representative: { disclosure: { rcept_no: string } };
}

export function selectDisclosureHighlights<T extends HighlightCandidate>(candidates: readonly T[]): T[] {
  const seen = new Set<string>();
  return [...candidates]
    .filter((item) => PRIORITY_TYPES.has(item.signalType) && dartFilingUrl(item.representative.disclosure.rcept_no))
    .sort((a, b) => b.rcept_dt_latest.localeCompare(a.rcept_dt_latest) ||
      b.representative.disclosure.rcept_no.localeCompare(a.representative.disclosure.rcept_no))
    .filter((item) => {
      const receipt = item.representative.disclosure.rcept_no;
      if (seen.has(receipt)) return false;
      seen.add(receipt);
      return true;
    })
    .slice(0, 3);
}
