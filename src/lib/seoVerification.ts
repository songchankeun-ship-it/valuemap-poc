// 검색엔진 소유권 검증 메타데이터 — SEO Slice D.
//
// Google Search Console / Naver Search Advisor 의 "HTML 메타태그" 소유권 확인용
// 토큰을 환경변수로만 주입한다. 토큰은 공개 <head> 값(운영자가 각 콘솔에서 발급)이며
// 저장소에 절대 커밋하지 않는다(.env.example 은 빈 placeholder 만 둔다).
//
// 규칙:
//  - 변수 미설정/공백이면 해당 <meta> 를 방출하지 않는다 → 로컬 빌드는 토큰 없이 동작.
//  - 값이 있으면 Next Metadata API 의 verification 필드로 정확한 태그를 방출한다
//    (google → <meta name="google-site-verification">, naver → <meta name="naver-site-verification">).
//  - 점수·가격 등 휘발성 데이터와 무관한 순수 함수. 서버(빌드/SSR)에서만 읽는다.
import type { Metadata } from "next";

// 소유권 토큰 환경변수 이름(단일 진실 소스). Slice E 게이트/테스트가 재사용한다.
export const GOOGLE_SITE_VERIFICATION_ENV = "GOOGLE_SITE_VERIFICATION";
export const NAVER_SITE_VERIFICATION_ENV = "NAVER_SITE_VERIFICATION";

// Naver 가 요구하는 메타태그 이름.
export const NAVER_VERIFICATION_META_NAME = "naver-site-verification";

// 공백/빈 문자열은 미설정으로 취급(빈 placeholder 를 그대로 .env 로 복사해도 태그가 새지 않음).
function cleanToken(raw: string | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// 주입된 env(기본 process.env)에서 소유권 검증 메타데이터를 만든다.
// 두 토큰 모두 없으면 undefined 를 반환해 Next 가 verification 필드를 아예 생략하게 한다.
// 파라미터는 process.env 와 테스트용 부분 env 리터럴을 모두 받도록 느슨한 레코드 타입.
export function ownershipVerification(
  env: Record<string, string | undefined> = process.env,
): Metadata["verification"] | undefined {
  const google = cleanToken(env[GOOGLE_SITE_VERIFICATION_ENV]);
  const naver = cleanToken(env[NAVER_SITE_VERIFICATION_ENV]);

  if (!google && !naver) return undefined;

  const verification: NonNullable<Metadata["verification"]> = {};
  if (google) verification.google = google;
  if (naver) verification.other = { [NAVER_VERIFICATION_META_NAME]: naver };
  return verification;
}
