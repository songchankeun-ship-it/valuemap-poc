/**
 * 다국어 v2 — 법률 문서(/terms · /privacy)의 영어 "요약" 문구.
 *
 * 주의: 이 파일은 정식 영어 법률 번역이 아니다. 약관·개인정보처리방침의
 * 권위 있는 본문은 한국어 서버 페이지에 그대로 유지되며, 영어(EN) 선택 시
 * 페이지 상단에 아래 요약과 "정식 영어 번역 보류" 고지를 함께 노출한다.
 * 제공자/회사명(Kakao/Google/Naver/Supabase/Resend/Vercel/Anthropic/DART/KRX)과
 * 날짜는 원문 형태를 유지한다.
 */
import type { Locale } from "@/lib/i18n";

/**
 * 모든 법률 영어 요약 화면에서 동일하게 노출하는 보류 고지.
 * 한국어 본문이 권위 있는 정본임을 분명히 알린다.
 */
export const LEGAL_EN_PENDING_NOTE =
  "This is the Korean legal policy; full English legal translation is pending owner/legal review.";

export const legalEnSummaryCopy = {
  ko: {
    // ko에서는 영어 요약 컴포넌트가 아무것도 렌더링하지 않으므로 실제로 사용되지 않는다.
    // 타입 일관성(Record<Locale, ...>)을 위해 빈/플레이스홀더 값을 유지한다.
    badge: "",
    pendingNote: "",
    terms: {
      title: "",
      intro: "",
      headings: [] as string[],
    },
    privacy: {
      title: "",
      intro: "",
      headings: [] as string[],
      processorsTitle: "",
      processorsDesc: "",
      crossBorderTitle: "",
      crossBorderDesc: "",
    },
  },
  en: {
    badge: "English summary",
    pendingNote: LEGAL_EN_PENDING_NOTE,
    terms: {
      title: "Terms of Service — English summary",
      intro:
        "OrnScore is a data-analytics tool for publicly available Korean stock-market data. It does not provide investment advice, buy/sell recommendations, or return guarantees. Login uses email magic link or social login (Kakao / Google / Naver) — no passwords are stored. All features are currently free; paid plans are not offered yet. The authoritative policy is the Korean text below.",
      headings: [
        "Article 1 (Purpose)",
        "Article 2 (Nature of the service)",
        "Article 3 (Sign-up and accounts)",
        "Article 4 (Limitation of liability)",
        "Paid service (planned · draft, not yet binding)",
        "Article 5 (Intellectual property)",
        "Article 6 (Changes and suspension of the service)",
        "Article 7 (Changes to these terms)",
        "Article 8 (Contact)",
      ],
    },
    privacy: {
      title: "Privacy Policy — English summary",
      intro:
        "This summary outlines what OrnScore collects (email, social-login identifiers, usage records, access logs), why it is used (login, multi-device sync, opt-in alert emails, anonymous analytics), retention and deletion, third-party disclosure limits, and your rights. The authoritative policy is the Korean text below.",
      headings: [
        "1. Personal data collected",
        "2. Purpose of use",
        "3. Retention and deletion",
        "4. Disclosure to third parties",
        "5. Processors",
        "5-1. Cross-border transfer of personal data",
        "6. Your rights",
        "7. Security measures",
        "8. Data protection officer",
      ],
      processorsTitle: "Processors (summary of section 5)",
      processorsDesc:
        "OrnScore relies on external processors, each governed by its own privacy policy: Supabase (Tokyo, Japan — authentication and data storage), Vercel (USA — hosting and anonymous analytics), Resend (USA — alert emails), Anthropic Claude (USA — AI analysis; Anthropic does not use API inputs to train models), Kakao (South Korea — social login), Google (USA — social login), and Naver (South Korea — social login). Social login is used only if you choose it.",
      crossBorderTitle: "Cross-border transfer (summary of section 5-1)",
      crossBorderDesc:
        "Some processors host servers outside Korea (Supabase in Japan; Vercel, Resend, Anthropic, and Google in the USA), so personal data may be transferred and processed abroad for the items and purposes in section 5. Kakao and Naver are processed domestically. If you do not want cross-border transfer, you can stop using the related features (AI analysis, alerts) or withdraw your membership. See the table in the Korean body for transfer items, timing, retention, and how to refuse.",
    },
  },
} as const satisfies Record<Locale, unknown>;
