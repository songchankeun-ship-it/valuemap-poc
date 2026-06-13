// POST /api/waitlist  { email, source } — 유료 출시 대기자 등록.
// Supabase 'waitlist' 테이블 필요 (아래 SQL). 결제 없음 — 수요 검증용.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source : "pricing";
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "유효한 이메일을 입력해주세요." }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { error } = await supabase.from("waitlist").insert({ email, source });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "요청을 처리하지 못했어요." }, { status: 500 });
  }
}
