import type { MetadataRoute } from "next";

/**
 * PWA manifest (Next-native · 설계서 PART H §24).
 * 외부 npm 의존 없이 기존 에셋만 재사용한다. Task 74에서 src/app/icon.svg(브랜드 마크)를
 * 기반으로 PNG 아이콘을 생성(scripts/generate-icons.mjs, Node 표준 라이브러리만)해
 * public/icon-192.png · icon-512.png · icon-512-maskable.png를 추가했다.
 * 아래 icons 배열은 SVG(sizes "any" 폴백) + PNG 192/512(purpose "any") + 512 maskable을 함께 노출한다.
 * apple-touch-icon(180px)은 src/app/layout.tsx metadata.icons.apple로 연결한다.
 * service worker는 캐싱/배포 충돌을 피하기 위해 이번에도 미등록(문서 스텁) — docs/app-roadmap.md §4 참조.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "오른스코어 — 한국 주식 탐색 도구",
    short_name: "오른스코어",
    description: "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    dir: "ltr",
    categories: ["finance"],
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "ko-KR",
    orientation: "portrait",
    // 기존 라우트만 가리키는 설치 바로가기 — 새 에셋/페이지 추가 없음.
    shortcuts: [
      { name: "오늘", short_name: "오늘", url: "/today" },
      { name: "종목 찾기", short_name: "종목", url: "/stocks" },
      { name: "공시 신호", short_name: "공시", url: "/disclosures" },
    ],
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
