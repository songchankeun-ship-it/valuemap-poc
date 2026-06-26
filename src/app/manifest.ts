import type { MetadataRoute } from "next";

/**
 * PWA manifest (Next-native · 설계서 PART H §24).
 * 외부 npm 의존 없이 기존 에셋만 재사용한다. 현재 저장소의 아이콘은 src/app/icon.svg(벡터) 하나뿐이라
 * SVG 아이콘을 sizes "any"로 참조한다. 일부 안드로이드 런처는 설치 시 512px PNG 마스커블 아이콘을
 * 선호하므로, 운영자가 public/icon-512.png(+ maskable)를 추가하면 아래 icons 배열에 보강 권장.
 * service worker는 캐싱/배포 충돌을 피하기 위해 이번에는 미등록(문서 스텁) — docs 참조.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "오른스코어 — 한국 주식 탐색 도구",
    short_name: "오른스코어",
    description: "138개 종목의 자체 지표 4종 · PER · PBR · ROE · DART 공시 신호를 한 화면에서.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "ko-KR",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
