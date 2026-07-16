import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NAVER_USERINFO_URL = "https://openapi.naver.com/v1/nid/me";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_authorization" }, { status: 401 });
  }

  const response = await fetch(NAVER_USERINFO_URL, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "provider_userinfo_failed" }, { status: 502 });
  }

  const payload = (await response.json()) as {
    response?: {
      id?: string;
      email?: string;
      name?: string;
      nickname?: string;
      profile_image?: string;
    };
  };
  const profile = payload.response;

  if (!profile?.id) {
    return NextResponse.json({ error: "provider_id_missing" }, { status: 502 });
  }

  return NextResponse.json(
    {
      id: profile.id,
      sub: profile.id,
      email: profile.email,
      name: profile.name ?? profile.nickname,
      preferred_username: profile.nickname ?? profile.name,
      picture: profile.profile_image,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
