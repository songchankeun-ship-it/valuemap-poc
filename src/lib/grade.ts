// 종합점수 → 탐색 우선도 라벨. 투자등급 오해를 피하려 문자등급(A+) 대신 행동 우선순위로 표현.
export interface Grade { grade: string; label: string }

export function gradeOf(score: number): Grade {
  if (score >= 85) return { grade: "최우선 확인", label: "상위" };
  if (score >= 75) return { grade: "우선 확인", label: "상위" };
  if (score >= 65) return { grade: "추가 관찰", label: "중상" };
  if (score >= 50) return { grade: "일반", label: "중위" };
  return { grade: "조건 낮음", label: "하위" };
}
