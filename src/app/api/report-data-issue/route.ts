// POST /api/report-data-issue  { category, ticker, message, email?, asOfDate?, metricsVersion? }
// 데이터 오류 신고를 Supabase 'data_reports' 테이블에 저장한다(있을 때). 메일 fallback은 UI가 항상 유지.
// waitlist 라우트와 동일한 graceful 패턴 — 테이블/env 부재 시 500으로 떨어지고 UI가 mailto로 안내.
//
// 필요한 테이블 (Supabase SQL):
//   create table if not exists data_reports (
//     id uuid primary key default gen_random_uuid(),
//     created_at timestamptz not null default now(),
//     category text not null,
//     ticker text,
//     message text not null,
//     email text,
//     as_of_date text,
//     metrics_version text,
//     status text not null default 'new'
//   );
//   -- 운영자(service role)만 접근. RLS 활성 + 익명 insert 정책은 운영 정책에 따라 결정.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CATEGORIES = ["price", "financial", "disclosure", "score", "sector", "other"];

function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const category = CATEGORIES.includes(body?.category) ? body.category : "other";
    const ticker = clip(body?.ticker, 20);
    const message = clip(body?.message, 2000);
    const emailRaw = clip(body?.email, 200).toLowerCase();
    const asOfDate = clip(body?.asOfDate, 40);
    const metricsVersion = clip(body?.metricsVersion, 40);

    if (message.length < 5) {
      return NextResponse.json({ error: "신고 내용을 5자 이상 적어주세요." }, { status: 400 });
    }
    if (emailRaw && !EMAIL_RE.test(emailRaw)) {
      return NextResponse.json({ error: "이메일 형식을 확인해주세요." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("data_reports").insert({
      category,
      ticker: ticker || null,
      message,
      email: emailRaw || null,
      as_of_date: asOfDate || null,
      metrics_version: metricsVersion || null,
    });
    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도하거나 메일로 신고해주세요." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "요청을 처리하지 못했어요. 메일로 신고해주세요." }, { status: 500 });
  }
}
