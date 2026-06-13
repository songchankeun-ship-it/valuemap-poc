import Link from "next/link";

export const metadata = {
  title: "이용약관 — 밸류맵 스톡",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">이용약관</h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">최종 갱신: 2026년 6월</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제1조 (목적)</h2>
          <p>본 약관은 밸류맵(이하 "서비스")이 제공하는 데이터 분석 도구 이용과 관련하여 서비스 운영자와 이용자 사이의 권리·의무, 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제2조 (서비스의 성격)</h2>
          <p>본 서비스는 공개된 한국 주식 시장 데이터(KRX·DART·Naver Finance·yfinance 등)와 자체 산식에 따른 점수·신호를 제공하는 <strong className="text-zinc-900 dark:text-zinc-100">데이터 분석 도구</strong>입니다.</p>
          <p>본 서비스는 다음을 제공하지 않습니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>투자자문, 투자권유, 매수·매도 추천</li>
            <li>특정 종목·자산의 수익 보장</li>
            <li>금융투자상품의 판매 또는 중개</li>
            <li>실시간 시세 또는 거래 체결 기능</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제3조 (회원가입 및 계정)</h2>
          <p>이용자는 이메일 매직링크 또는 카카오 OAuth를 통해 본 서비스에 회원가입할 수 있습니다. 계정의 보안 유지 책임은 이용자 본인에게 있습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제4조 (책임의 한계)</h2>
          <p><strong className="text-zinc-900 dark:text-zinc-100">투자 판단의 책임은 전적으로 이용자 본인에게 있습니다.</strong> 본 서비스가 제공하는 점수·신호·분석은 과거 데이터에 기반한 참고 정보이며, 미래 수익을 보장하지 않습니다.</p>
          <p>운영자는 다음에 대해 책임을 지지 않습니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>데이터 출처(KRX·DART·Naver·yfinance 등) 시스템의 오류 또는 지연</li>
            <li>서비스 정보를 기반으로 한 투자 결과의 손실</li>
            <li>일시적 서비스 중단 또는 데이터 갱신 지연</li>
            <li>제3자 사이트(DART 원문 링크 등) 이동 후 발생한 문제</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제5조 (지적재산권)</h2>
          <p>본 서비스가 자체 개발한 점수 산식, UI 디자인, 코드는 운영자의 지적재산입니다. 무단 복제·배포·상업적 활용을 금지합니다.</p>
          <p>원본 데이터(KRX·DART·Naver Finance 등)의 저작권은 각 출처에 있습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제6조 (서비스 변경 및 중단)</h2>
          <p>운영자는 서비스 개선, 데이터 출처 변경, 점검 등의 사유로 서비스 내용·운영 시간을 변경하거나 일시 중단할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제7조 (약관 변경)</h2>
          <p>본 약관은 운영 정책에 따라 변경될 수 있으며, 변경 시 본 페이지를 통해 공지됩니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">제8조 (문의)</h2>
          <p>약관 관련 문의: <a href="mailto:songchankeun@gmail.com" className="text-blue-600 dark:text-blue-400 underline">songchankeun@gmail.com</a></p>
        </section>

      </div>

      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 text-center">
        <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">서비스 소개</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline">개인정보처리방침</Link>
      </div>
    </div>
  );
}
