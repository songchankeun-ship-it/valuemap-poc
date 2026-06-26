// 로그인 OAuth 제공자 단일 출처 (single source of truth)
//
// /login 버튼과 약관·개인정보 문구가 이 목록에서 파생되도록 한다.
// 핸들러를 제공자마다 복붙하지 않고, 여기 한 곳에서 추가·토글한다.
//
// 타입 안전성: 아래 id 들은 createClient().auth.signInWithOAuth({ provider })에
// 그대로 넘겨지며, 설치된 @supabase/auth-js 의 Provider 유니온과 대조 검증된다.
// 예) "naver" 처럼 패키지가 지원하지 않는 값을 넣으면 호출부에서 tsc 가 막는다.
//
// 제공자 가용성 (설치된 @supabase/auth-js 2.107.0 기준):
//   - kakao  : 지원 ✅ (이미 운영 중 — Supabase 콘솔 연결 완료)
//   - google : 지원 ✅ (Supabase 콘솔 Google provider 토글 + Google Cloud OAuth 클라이언트 필요)
//   - apple  : 지원 ✅ (단, 의사결정상 기본 비활성 — 아래 주석 참조)
//   - naver  : 미지원 ❌ (Provider 유니온에 없음 → 네이티브 OAuth 불가)
//       네이버를 붙이려면 Supabase 커스텀 OIDC/SAML(custom:* · Pro/Enterprise + 콘솔 구성)
//       또는 직접 OAuth 라우트 구현이 필요하다 — 신규 의존성·유료 플랜 없이는 범위 밖.
//       자세한 차단 사유는 docs/auth-providers-setup.md 참조. 가짜로 만들지 않는다.

export type OAuthProviderId = "kakao" | "google" | "apple";

export type OAuthProviderConfig = {
  id: OAuthProviderId;
  /** 버튼 라벨 (이동 중이 아닐 때) */
  label: string;
  /** 이동 중 라벨 */
  redirectingLabel: string;
  /** 약관·개인정보 문구용 짧은 이름 */
  shortName: string;
  /** 버튼 색상/테두리 클래스 (Tailwind) */
  brandClasses: string;
  /**
   * 노출 여부. true 인 제공자만 /login 버튼·문구에 나타난다.
   * Supabase 콘솔 토글이 켜지기 전이라도 enabled 면 버튼은 보이며,
   * 클릭 시 "provider is not enabled" 오류는 사람이 읽을 한국어 메시지로 graceful 처리된다
   * (src/app/login/page.tsx 의 friendlyAuthError 참조).
   */
  enabled: boolean;
};

// 순서 = 화면 노출 순서. 카카오(운영 중)를 항상 첫 번째로 둔다.
export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: "kakao",
    label: "카카오로 시작하기",
    redirectingLabel: "카카오로 이동 중...",
    shortName: "카카오",
    // 카카오 브랜드 컬러 (노란 배경 + 진한 텍스트)
    brandClasses:
      "bg-[#FEE500] text-[#191919] hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed",
    enabled: true,
  },
  {
    id: "google",
    label: "구글로 시작하기",
    redirectingLabel: "구글로 이동 중...",
    shortName: "구글",
    // 구글 화이트 버튼 (라이트/다크 모두 흰 배경 + 테두리)
    brandClasses:
      "bg-white text-[#1f1f1f] border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed",
    enabled: true,
  },
  {
    id: "apple",
    label: "Apple로 시작하기",
    redirectingLabel: "Apple로 이동 중...",
    shortName: "Apple",
    // 애플 블랙 버튼 (라이트/다크 모두 검정 배경)
    brandClasses:
      "bg-black text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed",
    // 의사결정(명시적): Apple 로그인은 @supabase/auth-js 가 타입으로 지원하지만 기본 비활성으로 둔다.
    //   1) Apple Developer Program 유료 가입($99/년) + Service ID/Key 발급이 선행돼야 한다.
    //   2) 현재 오른스코어는 웹(한국 주식) 중심이며 iOS/macOS 네이티브 앱이 없어 Apple 로그인의
    //      실효 수요가 낮다 (Apple 로그인은 주로 iOS/macOS 사용자층에서 가치가 크다).
    // 구현 자체는 완비되어 있으므로, 위 선행조건과 Supabase 콘솔 Apple 토글을 켠 뒤
    // 이 한 줄을 enabled: true 로 바꾸면 즉시 버튼·문구·콜백이 활성화된다.
    enabled: false,
  },
];

/** 화면에 노출할(활성화된) 제공자만 반환 */
export function enabledOAuthProviders(): OAuthProviderConfig[] {
  return OAUTH_PROVIDERS.filter((p) => p.enabled);
}
