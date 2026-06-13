import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 — 밸류맵 스톡",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">개인정보처리방침</h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">최종 갱신: 2026년 6월</p>

      <div className="space-y-5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. 수집하는 개인정보</h2>
          <p>밸류맵은 서비스 제공을 위해 다음 정보를 수집합니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>이메일 주소</strong> — 로그인, 알림 발송, 계정 식별</li>
            <li><strong>카카오 로그인 사용 시</strong> — 카카오 계정 식별자, 닉네임, 프로필 사진 (선택)</li>
            <li><strong>이용 기록</strong> — 관심 종목, 비교 목록, AI 분석 기록, 알림 설정</li>
            <li><strong>접속 정보</strong> — IP 주소, 브라우저 정보 (Vercel Analytics 기반)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>회원 식별 및 로그인 처리</li>
            <li>관심 종목·비교 목록·분석 기록의 여러 기기 동기화</li>
            <li>공시 신호 알림 메일 발송 (사용자가 명시적으로 설정한 경우만)</li>
            <li>서비스 품질 개선을 위한 익명 통계 분석</li>
          </ul>
          <p className="mt-3"><strong className="text-zinc-900 dark:text-zinc-100">광고성 메일은 발송하지 않습니다.</strong> 알림은 사용자가 직접 켠 경우에만 발송되며, <Link href="/settings/notifications" className="text-blue-600 dark:text-blue-400 underline">알림 설정</Link>에서 언제든 끌 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. 보관 및 파기</h2>
          <p>회원 정보는 회원 탈퇴 시점까지 보관되며, 탈퇴 즉시 모든 정보가 파기됩니다. 단, 법령에 의해 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. 제3자 제공</h2>
          <p>이용자의 명시적 동의 없이는 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우 예외로 합니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>법령에 따른 요청이 있는 경우</li>
            <li>이용자의 생명·신체에 급박한 위험이 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5. 위탁 처리 (Processors)</h2>
          <p>서비스 제공을 위해 다음 외부 서비스를 이용합니다. 각 서비스는 자체 개인정보처리방침을 따릅니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>Supabase</strong> — 인증, 데이터 저장 (Tokyo 리전)</li>
            <li><strong>Vercel</strong> — 호스팅, Analytics</li>
            <li><strong>Resend</strong> — 이메일 발송</li>
            <li><strong>Anthropic Claude</strong> — AI 분석 (요청 시에만)</li>
            <li><strong>Kakao</strong> — 카카오 로그인 (선택 시)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">6. 이용자의 권리</h2>
          <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>본인의 개인정보 열람·수정 요청</li>
            <li>회원 탈퇴 및 개인정보 삭제 요청</li>
            <li>알림 수신 거부</li>
          </ul>
          <p className="mt-2">행사 방법: <a href="mailto:songchankeun@gmail.com" className="text-blue-600 dark:text-blue-400 underline">songchankeun@gmail.com</a>으로 이메일</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7. 보안 조치</h2>
          <p>이용자의 비밀번호는 저장하지 않습니다 (매직링크/카카오 OAuth 방식). 데이터는 Supabase의 Row Level Security로 본인만 접근 가능하도록 보호됩니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">8. 책임자</h2>
          <p>개인정보 보호 책임자: 송찬근 / 필로소디</p>
          <p>연락처: <a href="mailto:songchankeun@gmail.com" className="text-blue-600 dark:text-blue-400 underline">songchankeun@gmail.com</a></p>
        </section>

      </div>

      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 text-center">
        <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">서비스 소개</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">이용약관</Link>
      </div>
    </div>
  );
}
