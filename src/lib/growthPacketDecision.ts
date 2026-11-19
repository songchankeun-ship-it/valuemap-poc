export function growthPacketDecision(uses: number, entries: number | undefined, downstream?: number) {
  if (entries === undefined) return "측정 확인 대기";
  if (uses >= 2 && entries === 0) return "중단";
  if (uses >= 1 && entries > 0 && downstream !== undefined && downstream > 0) return "확대";
  return "관찰";
}
