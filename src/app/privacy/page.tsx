import Link from "next/link";
import { LegalEnSummary } from "@/components/legal/LegalEnSummary";

const privacyDescription =
  "오른스코어 개인정보처리방침. 수집·이용·보관 항목과 위탁·국외 이전, 이용자의 권리를 안내합니다.";

export const metadata = {
  title: "개인정보처리방침 — 오른스코어",
  description: privacyDescription,
  openGraph: {
    title: "개인정보처리방침 — 오른스코어",
    description: privacyDescription,
    url: "/privacy",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "개인정보처리방침 — 오른스코어",
    description: privacyDescription,
  },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">개인정보처리방침</h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">최종 갱신: 2026-07-01</p>

      <LegalEnSummary surface="privacy" />

      <div className="space-y-5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. 수집하는 개인정보</h2>
          <p>오른스코어는 서비스 제공을 위해 다음 정보를 수집합니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>이메일 주소</strong> — 로그인, 알림 발송, 계정 식별</li>
            <li><strong>소셜 로그인(카카오·구글·네이버) 사용 시</strong> — 제공자 계정 식별자, 닉네임·이름, 이메일, 프로필 사진 (제공자가 전달하는 항목에 한함)</li>
            <li><strong>이용 기록</strong> — 관심 종목, 비교 목록, 알림 설정</li>
            <li><strong>접속 정보</strong> — IP 주소, 브라우저 정보 (Vercel Analytics 기반)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>회원 식별 및 로그인 처리</li>
            <li>관심 종목·비교 목록의 여러 기기 동기화</li>
            <li>공시 신호 알림 메일 발송 (사용자가 명시적으로 설정한 경우만)</li>
            <li>서비스 품질 개선을 위한 익명 통계 분석</li>
          </ul>
          <p className="mt-3"><strong className="text-zinc-900 dark:text-zinc-100">광고성 메일은 발송하지 않습니다.</strong> 알림은 사용자가 직접 켠 경우에만 발송되며, <Link href="/settings/notifications" className="text-blue-600 dark:text-blue-400 underline">알림 설정</Link>에서 언제든 끌 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. 보관 및 파기</h2>
          <p>회원 정보는 회원 탈퇴 시점까지 보관되며, 탈퇴 즉시 모든 정보가 파기됩니다. 단, 법령에 의해 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>접속 로그·분석 데이터</strong>: 통계 목적으로만 사용하며 최대 12개월 내 파기 또는 익명화.</li>
            <li><strong>알림 메일 관련 이메일</strong>: 사용자가 알림 기능을 직접 켠 경우 발송 목적에 한해 이용하며, 알림 해제·회원 탈퇴 시 처리 중단.</li>
          </ul>
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
          <p>서비스 제공을 위해 다음 외부 서비스를 이용합니다. 각 서비스는 자체 개인정보처리방침을 따르며, 아래 링크에서 확인할 수 있습니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>인증·저장 제공자 — Supabase</strong> (일본 Tokyo) — 항목: 이메일·계정 식별자·관심 종목·비교 목록·알림 설정 / 목적: 인증·데이터 저장 — <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">처리방침 ↗</a></li>
            <li><strong>호스팅 제공자 — Vercel</strong> (미국) — 항목: IP·접속정보 / 목적: 호스팅·익명 통계 — <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">처리방침 ↗</a></li>
            <li><strong>메일 발송 제공자 — Resend</strong> (미국) — 항목: 이메일 주소 / 목적: 알림 메일 발송 — <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">처리방침 ↗</a></li>
            <li><strong>소셜 로그인 제공자 — Kakao</strong> (대한민국) — 항목: 카카오 계정 식별자·닉네임 / 목적: 소셜 로그인(선택 시) — <a href="https://policy.kakao.com/ko/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">처리방침 ↗</a></li>
            <li><strong>소셜 로그인 제공자 — Google</strong> (미국) — 항목: 구글 계정 식별자·이메일·이름·프로필 사진 / 목적: 소셜 로그인(선택 시) — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">처리방침 ↗</a></li>
            <li><strong>소셜 로그인 제공자 — Naver</strong> (대한민국) — 항목: 네이버 계정 식별자·이메일 / 목적: 소셜 로그인(선택 시) — <a href="https://privacy.naver.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">처리방침 ↗</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5-1. 개인정보의 국외 이전</h2>
          <p>아래 제공자는 국외에 서버를 두고 있어, 5항의 항목·목적에 따라 개인정보가 국경을 넘어 이전·보관·처리될 수 있습니다. 이용자는 국외 이전을 원치 않을 경우 해당 기능(알림 등) 사용을 중단하거나 회원 탈퇴로 거부할 수 있습니다.</p>
          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 md:hidden">표가 화면보다 넓으면 좌우로 밀어 전체 열(이전 항목·목적·거부 방법 등)을 볼 수 있습니다.</p>
          <div className="mt-2 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <table className="min-w-[480px] w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">이전받는 자</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">국가</th>
                  <th className="py-2 pr-3 font-medium">이전 항목</th>
                  <th className="py-2 pr-3 font-medium">이전 목적</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">이전 시점</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">보유기간</th>
                  <th className="py-2 pr-0 font-medium whitespace-nowrap">거부 방법</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300 align-top">
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Supabase</td>
                  <td className="py-2 pr-3 whitespace-nowrap">일본</td>
                  <td className="py-2 pr-3">이메일·계정 식별자·관심 종목·비교 목록·알림 설정</td>
                  <td className="py-2 pr-3">인증·데이터 저장</td>
                  <td className="py-2 pr-3">회원가입·서비스 이용 시</td>
                  <td className="py-2 pr-3 whitespace-nowrap">탈퇴 시까지</td>
                  <td className="py-2 pr-0 whitespace-nowrap">회원탈퇴</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Vercel</td>
                  <td className="py-2 pr-3 whitespace-nowrap">미국</td>
                  <td className="py-2 pr-3">IP·접속정보</td>
                  <td className="py-2 pr-3">호스팅·익명 통계</td>
                  <td className="py-2 pr-3">접속 시</td>
                  <td className="py-2 pr-3 whitespace-nowrap">정책 기준</td>
                  <td className="py-2 pr-0 whitespace-nowrap">접속 제한</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Resend</td>
                  <td className="py-2 pr-3 whitespace-nowrap">미국</td>
                  <td className="py-2 pr-3">이메일 주소</td>
                  <td className="py-2 pr-3">알림 메일 발송</td>
                  <td className="py-2 pr-3">알림 발송 시</td>
                  <td className="py-2 pr-3 whitespace-nowrap">발송 로그 기준</td>
                  <td className="py-2 pr-0 whitespace-nowrap">알림 해제</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Google</td>
                  <td className="py-2 pr-3 whitespace-nowrap">미국</td>
                  <td className="py-2 pr-3">구글 계정 식별자·이메일·이름·프로필 사진</td>
                  <td className="py-2 pr-3">소셜 로그인</td>
                  <td className="py-2 pr-3">구글 로그인 선택 시</td>
                  <td className="py-2 pr-3 whitespace-nowrap">탈퇴 시까지</td>
                  <td className="py-2 pr-0 whitespace-nowrap">구글 로그인 미사용</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">소셜 로그인 중 Kakao와 Naver는 국내 처리되며, Google은 미국에서 처리되어 위 표에 포함됩니다. 위탁사 변경·추가 시 본 표를 갱신합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">6. 이용자의 권리</h2>
          <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>본인의 개인정보 열람·수정 요청</li>
            <li>회원 탈퇴 및 개인정보 삭제 요청</li>
            <li>본인 개인정보 사본(다운로드) 요청</li>
            <li>알림 수신 거부</li>
          </ul>
          <p className="mt-2">행사 방법: <a href="mailto:songchankeun@gmail.com" className="text-blue-600 dark:text-blue-400 underline">songchankeun@gmail.com</a>으로 이메일</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7. 보안 조치</h2>
          <p>이용자의 비밀번호는 저장하지 않습니다 (매직링크/소셜 OAuth 방식 — 카카오·구글·네이버). 데이터는 Supabase의 Row Level Security로 본인만 접근 가능하도록 보호됩니다.</p>
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
