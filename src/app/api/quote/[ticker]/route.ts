// GET /api/quote/[ticker] - compatibility endpoint for the published market-close snapshot.
// It performs no external quote request. The stock page renders the same published close directly.
import { NextResponse } from "next/server";
import { dataMetadata, realStockPool } from "@/lib/realStocks";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const code = (ticker || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "invalid ticker" }, { status: 400 });
  }

  const stock = realStockPool.find((candidate) => candidate.ticker === code);
  if (!stock) {
    return NextResponse.json({ ok: false, error: "ticker not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      ticker: code,
      price: stock.currentPrice,
      change: null,
      changePct: stock.changePct,
      marketStatus: "CLOSED",
      tradedAt: null,
      asOf: dataMetadata.asOfBusinessDate ?? null,
      name: stock.name,
      source: "published-close",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    },
  );
}
