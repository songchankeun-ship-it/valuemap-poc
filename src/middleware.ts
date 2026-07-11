import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const FALLBACK_ADMIN_EMAILS = ["contact@ornscore.com"];

function adminEmailSet(): Set<string> {
  const configured = (process.env.ADMIN_EMAILS ?? process.env.ORNSCORE_ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const emails = configured.length > 0 ? configured : FALLBACK_ADMIN_EMAILS;
  return new Set(emails.map((email) => email.toLowerCase()));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  if (isAdminRoute) {
    const email = data.user?.email?.trim().toLowerCase();
    if (!email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
      return NextResponse.redirect(loginUrl);
    }
    if (!adminEmailSet().has(email)) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: {
          "x-robots-tag": "noindex, nofollow",
          "cache-control": "private, no-store",
        },
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
