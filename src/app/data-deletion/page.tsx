import Link from "next/link";

const dataDeletionDescription =
  "오른스코어 계정 및 데이터 삭제 요청 안내. 로그인 계정, 관심 종목, 비교 목록, 알림 설정 등 삭제 요청 방법을 안내합니다.";

export const metadata = {
  title: "계정 및 데이터 삭제 요청 — 오른스코어",
  description: dataDeletionDescription,
  openGraph: {
    title: "계정 및 데이터 삭제 요청 — 오른스코어",
    description: dataDeletionDescription,
    url: "/data-deletion",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "계정 및 데이터 삭제 요청 — 오른스코어",
    description: dataDeletionDescription,
  },
  alternates: { canonical: "/data-deletion" },
};

const requestSubject = encodeURIComponent("오른스코어 계정 및 데이터 삭제 요청");
const requestBody = encodeURIComponent(
  [
    "오른스코어 계정 및 데이터 삭제를 요청합니다.",
    "",
    "1. 로그인에 사용한 이메일:",
    "2. 삭제 요청 범위: 계정 및 관련 데이터 전체 / 일부 데이터",
    "3. 추가 확인 사항:",
  ].join("\n"),
);

export default function DataDeletionPage() {
  const mailHref = `mailto:contact@ornscore.com?subject=${requestSubject}&body=${requestBody}`;

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        계정 및 데이터 삭제 요청
      </h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">최종 갱신: 2026-07-12</p>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 mb-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">English summary</div>
        <p>
          You can request deletion of your ORNScore account and associated data by emailing{" "}
          <a href={mailHref} className="text-blue-600 dark:text-blue-400 underline">
            contact@ornscore.com
          </a>
          . Include the email address used for sign-in and the scope of your request.
        </p>
      </div>

      <div className="space-y-5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            1. 어떤 데이터를 삭제할 수 있나요?
          </h2>
          <p>오른스코어 계정과 연결된 다음 데이터를 삭제 요청할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>로그인 계정 식별 정보: 이메일, 소셜 로그인 제공자 식별자</li>
            <li>관심 종목, 비교 목록, 알림 설정</li>
            <li>계정 기능 제공을 위해 저장된 서비스 이용 설정</li>
            <li>알림 메일 발송 목적의 이메일 사용 중단</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            2. 삭제 요청 방법
          </h2>
          <p>
            아래 버튼으로 운영팀에 이메일을 보내주세요. 본인 확인을 위해 로그인에 사용한 이메일 주소와
            삭제 요청 범위를 함께 적어주면 더 빠르게 처리할 수 있습니다.
          </p>
          <a
            href={mailHref}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            삭제 요청 이메일 보내기
          </a>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            이메일 앱이 열리지 않으면 <span className="font-medium text-zinc-700 dark:text-zinc-300">contact@ornscore.com</span>으로
            직접 보내면 됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            3. 처리 절차와 예상 기간
          </h2>
          <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
            <li>운영팀이 요청 메일을 확인합니다.</li>
            <li>필요한 경우 계정 소유 여부 확인을 위해 추가 정보를 요청할 수 있습니다.</li>
            <li>본인 확인 후 계정 및 관련 데이터를 삭제하거나, 삭제가 제한되는 항목을 안내합니다.</li>
            <li>처리 완료 후 요청한 이메일로 결과를 안내합니다.</li>
          </ol>
          <p className="mt-2">
            요청은 가능한 한 빠르게 처리합니다. 법령, 보안, 부정사용 방지, 분쟁 대응 등 정당한 사유가 있는
            일부 기록은 필요한 기간 동안 제한적으로 보관될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            4. 삭제 후 달라지는 점
          </h2>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>로그인 기반 관심 종목과 비교 목록 동기화가 중단됩니다.</li>
            <li>알림 설정과 알림 메일 발송이 중단됩니다.</li>
            <li>삭제된 데이터는 복구가 어려울 수 있습니다.</li>
            <li>로그인하지 않고 보는 공개 페이지와 시장 데이터 탐색 기능은 계속 이용할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            5. 관련 문서
          </h2>
          <p>
            수집 항목, 위탁 처리, 국외 이전, 보관 및 파기 기준은{" "}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 underline">
              개인정보처리방침
            </Link>
            에서 함께 확인할 수 있습니다.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 text-center">
        <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">
          개인정보처리방침
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">
          이용약관
        </Link>
        <span className="mx-2">·</span>
        <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">
          서비스 소개
        </Link>
      </div>
    </div>
  );
}
