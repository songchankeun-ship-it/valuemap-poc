// GET /api/quote/[ticker] — 네이버 지연 시세(참고용). 실패 시 ok:false → 클라이언트는 종가로 fallback.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const NAVER = (code: string) =>
  `https://polling.finance.naver.com/api/realtime/domestic/stock/${code}`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const code = (ticker || "").replace(/[^0-9A-Za-z]/g, "");
  if (!code) {
    return NextResponse.json({ ok: false, error: "no ticker" }, { status: 400 });
  }
  try {
    const res = await fetch(NAVER(code), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://finance.naver.com/",
      },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `naver ${res.status}` });
    }
    const json = await res.json();
    const d = json?.datas?.[0];
    if (!d || d.closePriceRaw == null) {
      return NextResponse.json({ ok: false, error: "no data" });
    }
    // 방향 코드: 1=상한,2=상승,3=보합,4=하한,5=하락
    const dir = String(d.compareToPreviousPrice?.code ?? "");
    const sign = dir === "4" || dir === "5" ? -1 : dir === "3" ? 0 : 1;
    const price = Number(d.closePriceRaw);
    const changeAbs = Math.abs(Number(d.compareToPreviousClosePriceRaw));
    const pctAbs = Math.abs(Number(d.fluctuationsRatioRaw));
    if (!Number.isFinite(price)) {
      return NextResponse.json({ ok: false, error: "bad price" });
    }
    return NextResponse.json({
      ok: true,
      ticker: code,
      price,
      change: sign * (Number.isFinite(changeAbs) ? changeAbs : 0),
      changePct: sign * (Number.isFinite(pctAbs) ? pctAbs : 0),
      marketStatus: d.marketStatus ?? null,
      tradedAt: d.localTradedAt ?? null,
      name: d.stockName ?? null,
      source: "naver-delayed",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
