import { NextResponse } from "next/server";
import {
  buildBetaFeedbackMessage,
  parseBetaFeedback,
} from "@/lib/betaFeedback";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Quiet honeypot. Real users never see or fill this field.
    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const parsed = parseBetaFeedback(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("data_reports").insert({
      category: "beta",
      ticker: null,
      message: buildBetaFeedbackMessage(parsed.value),
      email: parsed.value.email,
      as_of_date: null,
      metrics_version: null,
      status: "new",
    });

    if (error) {
      return NextResponse.json(
        { error: "저장하지 못했어요. 아래 이메일 보내기를 이용해주세요." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "요청을 처리하지 못했어요. 아래 이메일 보내기를 이용해주세요." },
      { status: 500 },
    );
  }
}
