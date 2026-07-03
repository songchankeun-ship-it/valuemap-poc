import { OfflineContent } from "@/components/OfflineContent";

/**
 * 오프라인/네트워크 필요 안내 페이지 (설계서 PART H §24).
 * service worker가 등록되면 오프라인 fallback으로 쓸 수 있고, 등록 전에도 정적 안내로 동작한다.
 * metadata는 서버 컴포넌트에 남기고, 보이는 문구는 OfflineContent에서 로케일 전환한다.
 */
export const metadata = {
  title: "오프라인 — 오른스코어",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineContent />;
}
