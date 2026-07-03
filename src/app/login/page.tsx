import LoginContent from "./LoginContent";

// 로그인 화면. 클라이언트 상호작용(OAuth·매직링크·i18n)은 LoginContent 로 분리하고,
// 이 서버 컴포넌트는 제목/색인 메타데이터만 담당한다(offline/page.tsx 와 동일 패턴).
// 인증 진입점은 검색 색인 대상이 아니므로 noindex 로 둔다.
export const metadata = {
  title: "로그인 — 오른스코어",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginContent />;
}
