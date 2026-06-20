/** @type {import('next').NextConfig} */
const nextConfig = {};

// 로컬 저메모리 빌드 보호용 — NEXT_BUILD_CPUS 설정 시에만 정적 생성 워커 수를 제한한다.
// 환경변수가 없으면(예: Vercel) 기본 동작이라 운영 빌드에는 영향 없음.
if (process.env.NEXT_BUILD_CPUS) {
  nextConfig.experimental = {
    cpus: Number(process.env.NEXT_BUILD_CPUS) || 1,
    workerThreads: false,
  };
}

export default nextConfig;
