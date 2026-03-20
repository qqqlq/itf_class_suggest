import type { GradeRecord } from "@/types";

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.3,
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 0,
};

export function calculateGPA(grades: GradeRecord[]): number {
  const gpaGrades = grades.filter((g) => GRADE_POINTS[g.totalGrade] !== undefined);
  const totalPoints = gpaGrades.reduce(
    (sum, g) => sum + GRADE_POINTS[g.totalGrade] * g.credits,
    0
  );
  const totalCredits = gpaGrades.reduce((sum, g) => sum + g.credits, 0);
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

export function calculateEarnedCredits(grades: GradeRecord[]): number {
  return grades
    .filter((g) => g.totalGrade !== "D")
    .reduce((sum, g) => sum + g.credits, 0);
}

export function calculateCategoryCredits(
  grades: GradeRecord[],
  category: string
): number {
  return grades
    .filter((g) => g.category === category && g.totalGrade !== "D")
    .reduce((sum, g) => sum + g.credits, 0);
}
