import type { Curriculum, CurriculumCategory, GradeRecord, RequirementStatus } from "@/types";

function isPassing(grade: string): boolean {
  return grade !== "D" && grade !== "" && grade !== "-";
}

function matchesCourse(
  grade: GradeRecord,
  category: CurriculumCategory
): boolean {
  // 科目番号の完全一致
  if (category.courses?.includes(grade.courseId)) {
    return true;
  }
  // プレフィックスマッチ
  if (category.prefixes?.some((prefix) => grade.courseId.startsWith(prefix))) {
    return true;
  }
  return false;
}

export function checkRequirements(
  grades: GradeRecord[],
  curriculum: Curriculum
): RequirementStatus[] {
  return curriculum.categories.map((category) => {
    const matchedCourses = grades.filter(
      (g) => matchesCourse(g, category) && isPassing(g.totalGrade)
    );
    const earnedCredits = matchedCourses.reduce((sum, g) => sum + g.credits, 0);

    // 未取得の必修科目を算出
    const missingCourses: string[] = [];
    if (category.courses) {
      for (const courseId of category.courses) {
        const found = grades.find(
          (g) => g.courseId === courseId && isPassing(g.totalGrade)
        );
        if (!found) {
          missingCourses.push(courseId);
        }
      }
    }

    return {
      categoryName: category.name,
      type: category.type,
      earnedCredits,
      minCredits: category.minCredits,
      maxCredits: category.maxCredits,
      fulfilled: earnedCredits >= category.minCredits,
      missingCourses,
      matchedCourses,
    };
  });
}

export function getTotalEarnedCredits(grades: GradeRecord[]): number {
  return grades
    .filter((g) => isPassing(g.totalGrade))
    .reduce((sum, g) => sum + g.credits, 0);
}
