import { EvidenceShareButton } from "@/components/EvidenceShareButton";
import { stockSharePath } from "@/lib/growthShare";

export function ShareButton({ name, ticker }: { name: string; ticker: string }) {
  return (
    <EvidenceShareButton
      path={stockSharePath(ticker)}
      title={`${name} (${ticker}) — 오른스코어`}
      text={`${name}의 점수보다 먼저 확인할 근거와 순서를 오른스코어에서 확인하세요.`}
      analytics={{ kind: "stock", ticker }}
      label="종목 공유"
    />
  );
}
