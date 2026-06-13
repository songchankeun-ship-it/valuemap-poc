// 종합점수 → 등급. 소수점 점수의 과신을 줄이고 직관적 해석 제공.
export interface Grade { grade: string; label: string }

export function gradeOf(score: number): Grade {
  if (score >= 85) return { grade: "A+", label: "최상위권" };
  if (score >= 75) return { grade: "A", label: "상위권" };
  if (score >= 65) return { grade: "B+", label: "중상위권" };
  if (score >= 55) return { grade: "B", label: "중위권" };
  if (score >= 45) return { grade: "C+", label: "중하위권" };
  if (score >= 35) return { grade: "C", label: "하위권" };
  return { grade: "D", label: "최하위권" };
}
