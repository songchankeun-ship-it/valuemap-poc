// 로그인 복귀 경로(next) 정규화 - 단일 출처(single source of truth).
//
// 목적: open-redirect 방지. 로그인/콜백의 next 파라미터는 공격자가 조작할 수 있는
// 입력이므로, 검증 없이 redirect 대상으로 쓰면 외부 사이트로 튕기는 피싱(open redirect)에
// 노출된다. 이 함수는 "앱 내부 경로"만 통과시키고, 그 외에는 안전한 fallback("/")로 떨어진다.
//
// 차단 대상(외부/우회 트릭):
//   - 절대 URL("https://evil.com", "http://...") 및 스킴 포함("javascript:", "data:" 등 "://")
//   - 프로토콜-상대 URL("//evil.com") - 브라우저가 외부로 해석
//   - 백슬래시 우회("/\evil.com", "\\evil.com") - 일부 환경에서 "//"로 정규화됨
//   - 제어문자/공백 포함(개행/탭 등으로 검증을 흐트러뜨리는 입력)
//
// 의존성 0(서버 라우트 핸들러/클라이언트 양쪽에서 import 안전), ASCII-only.
// 내부 경로의 query/hash 는 보존한다(예: "/watchlist?tab=a#b").

const MAX_LEN = 512;

// 제어문자(코드포인트 <= 0x20: NUL/탭/개행/스페이스 포함) 또는 DEL(0x7F) 여부.
function hasControlOrWhitespace(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * raw 가 안전한 내부 경로면 그대로(정규화 후) 반환, 아니면 fallback 반환.
 *
 * 규칙: 반드시 "/" 하나로 시작하되 "//"(프로토콜-상대)/"/\"(백슬래시 우회)는 거부.
 * "://", 제어문자, 공백을 포함하면 거부. 길이는 방어적으로 제한.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw) return fallback;

  // 백슬래시를 슬래시로 정규화해 "\\evil.com" / "/\evil.com" 같은 우회를 일반화.
  const value = raw.replace(/\\/g, "/");

  // 길이 방어(과도하게 긴 입력은 거부).
  if (value.length > MAX_LEN) return fallback;

  // 제어문자(개행/탭/DEL 등)나 공백이 섞이면 거부.
  if (hasControlOrWhitespace(value)) return fallback;

  // 스킴이 섞인 절대 URL("http://", "javascript:..//" 등) 거부.
  if (value.includes("://")) return fallback;

  // 반드시 "/" 하나로 시작(상대경로/스킴 없는 절대 URL 차단).
  if (!value.startsWith("/")) return fallback;

  // 프로토콜-상대("//evil.com") 거부.
  if (value.startsWith("//")) return fallback;

  return value;
}
