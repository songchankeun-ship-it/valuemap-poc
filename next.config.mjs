/** @type {import('next').NextConfig} */
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

export default function nextConfigFactory(phase) {
  const nextConfig = {};

  // dev 서버와 prod 빌드가 같은 .next 디렉터리를 공유하면 청크가 충돌한다.
  // (npm run build = 타입게이트, AI Center Playwright 게이트 = next dev 가 번갈아
  //  같은 .next 를 써서 손상 → next dev 가 존재하지 않는 청크/CSS 를 참조해 404.)
  // dev 는 별도 distDir(.next-dev)로 분리해 prod 빌드 산출물과 절대 섞이지 않게 한다.
  // URL 경로(/_next/...)와 Vercel prod 빌드(.next)에는 영향이 없다.
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    nextConfig.distDir = '.next-dev';
  }

  // SEO 계약 보존(프레임워크 마이그레이션): Next 15.2+ 의 스트리밍 메타데이터는
  // JS 실행 봇에게는 Metadata API 태그(canonical·robots·description·OG/Twitter)를
  // <body> 로 흘려보내고 HTML 한정 봇에게만 <head> 블로킹 렌더한다. 마이그레이션 이전
  // (Next 14)에는 모든 UA 가 <head> 에서 이 태그를 받았고, 네이버 Yeti 등 JS 미실행
  // 크롤러도 canonical/robots 를 <head> 에서 읽어야 색인 계약이 유지된다. htmlLimitedBots
  // 를 /.*/ 로 두어 모든 UA 를 HTML 한정 봇으로 취급 → 메타데이터를 항상 <head> 에
  // 블로킹 렌더(= 마이그레이션 이전 동작 그대로). 메타데이터는 로컬 JSON 기반 동기 계산이라
  // TTFB 영향이 사실상 없다.
  nextConfig.htmlLimitedBots = /.*/;

  // 로컬 저메모리 빌드 보호용 — NEXT_BUILD_CPUS 설정 시에만 정적 생성 워커 수를 제한한다.
  // 환경변수가 없으면(예: Vercel) 기본 동작이라 운영 빌드에는 영향 없음.
  if (process.env.NEXT_BUILD_CPUS) {
    nextConfig.experimental = {
      cpus: Number(process.env.NEXT_BUILD_CPUS) || 1,
      workerThreads: false,
    };
  }

  return nextConfig;
}
