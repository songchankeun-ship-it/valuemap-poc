// 테마 기반 섹터(업종) 분류 + 업종 대비 밸류 분위.
// 데이터에 GICS 업종이 없어, 대표 테마 키워드로 섹터를 근사한다(완벽하진 않음).

export interface SectorStock {
  themes: string[];
  per: number;
  pbr: number;
}

const SECTOR_RULES: { sector: string; keys: string[] }[] = [
  { sector: "반도체·IT부품", keys: ["반도체", "HBM", "DDR", "팹리스", "후공정", "MLCC", "PCB", "LCD", "OLED", "디스플레이", "이미지센서", "스마트폰"] },
  { sector: "자동차", keys: ["자동차", "자동차부품", "자율주행"] },
  { sector: "2차전지·소재", keys: ["2차전지", "전기차", "배터리", "소재부품", "음극재", "양극재", "LFP"] },
  { sector: "바이오·제약·헬스", keys: ["바이오", "제약", "항암", "신약", "의료", "줄기세포", "미용기기", "치아", "의료기기", "비만치료제"] },
  { sector: "금융", keys: ["은행", "증권", "보험", "핀테크", "신용평가", "스테이블 코인"] },
  { sector: "조선·기계·방산", keys: ["조선", "방산", "변압기", "해상풍력", "우주항공", "철도", "원자력", "건설기계", "조선 기자재", "스페이스X"] },
  { sector: "소재·철강·화학", keys: ["철강", "석유화학", "화학", "원자재", "탄소섬유", "전선", "해저케이블", "정유화학", "구리", "불화수소"] },
  { sector: "인터넷·게임·엔터", keys: ["인공지능", "클라우드", "게임", "엔터", "K-콘텐츠", "영상콘텐츠", "OTT", "광고", "영화", "빅데이터", "의료AI"] },
  { sector: "소비재·유통", keys: ["음식료", "화장품", "K-뷰티", "소매유통", "백화점", "면세점", "패션", "주류", "가전", "항공", "물류", "렌터카", "리츠", "해운", "미세먼지"] },
  { sector: "건설·인프라", keys: ["건설", "인테리어", "리모델링", "해외 인프라", "종합상사"] },
  { sector: "통신", keys: ["통신", "5G"] },
  { sector: "지주·기타", keys: ["지주사"] },
];

export function sectorOf(themes: string[] | undefined): string {
  // 기업집단(○○그룹)은 업종이 아니므로 매칭에서 제외 — "현대자동차그룹"의 '자동차' 오매칭 방지
  const ts = (themes ?? []).filter((t) => !t.includes("그룹"));
  for (const rule of SECTOR_RULES) {
    if (ts.some((t) => rule.keys.some((k) => t.includes(k)))) return rule.sector;
  }
  return "기타";
}

export interface SectorValue { score: number; sector: string; peers: number }

/** 같은 업종 내 PER·PBR 상대 위치(0~100, 높을수록 업종 내 저평가). 피어 4개 미만이면 score=-1. */
export function sectorValueScore(target: SectorStock, pool: SectorStock[]): SectorValue {
  const sector = sectorOf(target.themes);
  const peers = pool.filter((p) => sectorOf(p.themes) === sector && p.per > 0 && p.pbr > 0);
  if (peers.length < 4 || !(target.per > 0 && target.pbr > 0)) {
    return { score: -1, sector, peers: peers.length };
  }
  const n = peers.length;
  // target보다 비싼(per/pbr이 큰) 피어 비율 → 높을수록 target이 저평가
  const perPct = peers.filter((p) => p.per >= target.per).length / n;
  const pbrPct = peers.filter((p) => p.pbr >= target.pbr).length / n;
  return { score: Math.round(((perPct + pbrPct) / 2) * 100), sector, peers: n };
}
