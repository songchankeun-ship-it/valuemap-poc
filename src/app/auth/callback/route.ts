import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/returnPath";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // next 는 공격자 조작 가능 입력 → 내부 경로만 통과(open-redirect 방지).
  const next = safeInternalPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // welcome=1 추가 → 도착 페이지에서 환영 토스트 표시
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set("welcome", "1");
      return NextResponse.redirect(redirectUrl);
    }
    // 코드 교환 실패(만료/변조 등) → 일반 로그인 실패로 안내.
    return NextResponse.redirect(buildErrorRedirect(origin, "auth_callback_failed", next));
  }

  // code 가 아예 없음 = 앱/standalone 에서 외부 브라우저로 로그인 후 앱 창으로
  // 콜백이 되돌아오지 못한 전형적 실패. 별도 코드로 구분해 친절한 안내를 노출한다.
  return NextResponse.redirect(buildErrorRedirect(origin, "auth_callback_no_code", next));
}

// 로그인 페이지로 친절한 오류와 검증된 next 를 함께 보존해 보낸다.
// next 가 "/"(기본)면 굳이 붙이지 않는다.
function buildErrorRedirect(origin: string, code: string, next: string): URL {
  const url = new URL("/login", origin);
  url.searchParams.set("error", code);
  if (next && next !== "/") url.searchParams.set("next", next);
  return url;
}
