// 한국어 조사 자동 선택 — 결정적(deterministic).
//
// 마지막 음절의 받침(종성) 유무로 조사를 고른다. 비교 랜딩의 종목명·지표명은 모두
// 한글이라 정확한 자연스러운 조사가 나오고, 혹시 비한글(영문·숫자 등)로 끝나는 이름
// (예: "삼성SDI")이 와도 플레이스홀더("은(는)"·"와(과)")를 절대 출력하지 않고 안전한
// 기본형으로 폴백한다. 순수 함수이므로 같은 입력이면 항상 같은 조사를 돌려준다.
//
// 폴백 규칙: 마지막 문자가 한글 음절(U+AC00–U+D7A3)이 아니면 "받침 없음(모음 종결)"으로
// 취급한다 — 즉 는/가/와 계열을 쓴다. 대다수 영문 약칭·기호에 무난하고, 무엇보다
// 크롤 가능한 출력에 "(...)" 형태의 플레이스홀더가 남지 않게 하는 안전판이다.

/**
 * 단어의 마지막 문자가 받침 있는 한글 음절이면 true, 받침 없는 한글 음절이면 false,
 * 한글 음절이 아니면(영문·숫자·기호·빈문자열) null.
 */
export function hasFinalConsonant(word: string): boolean | null {
  if (!word) return null;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return null; // 한글 음절이 아님
  return (code - 0xac00) % 28 !== 0; // 종성 인덱스 0 == 받침 없음
}

/** 주제 보조사: 받침 있으면 "은", 없으면(또는 비한글) "는". */
export function topicParticle(word: string): "은" | "는" {
  return hasFinalConsonant(word) === true ? "은" : "는";
}

/** 주격 조사: 받침 있으면 "이", 없으면(또는 비한글) "가". */
export function subjectParticle(word: string): "이" | "가" {
  return hasFinalConsonant(word) === true ? "이" : "가";
}

/** 접속 조사(A와/과 B): 받침 있으면 "과", 없으면(또는 비한글) "와". */
export function conjunctionParticle(word: string): "와" | "과" {
  return hasFinalConsonant(word) === true ? "과" : "와";
}

/** `단어 + 주제 보조사`(예: "밸류는", "시가총액은"). */
export function withTopic(word: string): string {
  return `${word}${topicParticle(word)}`;
}

/** `단어 + 주격 조사`(예: "삼성전자가", "삼성생명이"). */
export function withSubject(word: string): string {
  return `${word}${subjectParticle(word)}`;
}

/** `단어 + 접속 조사`(예: "삼성전자와", "삼성생명과"). */
export function withConjunction(word: string): string {
  return `${word}${conjunctionParticle(word)}`;
}
