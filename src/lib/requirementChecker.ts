import type {
  Curriculum,
  CurriculumCategory,
  CurriculumGroup,
  GradeRecord,
  GroupRequirementStatus,
  RequirementStatus,
} from "@/types";

function isPassing(grade: string): boolean {
  return grade !== "D" && grade !== "" && grade !== "-";
}

function matchesCourse(
  grade: GradeRecord,
  category: CurriculumCategory
): boolean {
  if (category.courses?.includes(grade.courseId)) {
    return true;
  }
  if (category.prefixes?.some((prefix) => grade.courseId.startsWith(prefix))) {
    return true;
  }
  return false;
}

function checkCategory(
  grades: GradeRecord[],
  category: CurriculumCategory
): RequirementStatus {
  const matchedCourses = grades.filter(
    (g) => matchesCourse(g, category) && isPassing(g.totalGrade)
  );
  const earnedCredits = matchedCourses.reduce((sum, g) => sum + g.credits, 0);

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
}

function checkGroup(
  grades: GradeRecord[],
  group: CurriculumGroup
): GroupRequirementStatus {
  const categories = group.categories.map((cat) => checkCategory(grades, cat));
  const earnedCredits = categories.reduce(
    (sum, cat) => sum + cat.earnedCredits,
    0
  );

  return {
    groupName: group.name,
    earnedCredits,
    minCredits: group.minCredits,
    maxCredits: group.maxCredits,
    fulfilled: earnedCredits >= group.minCredits,
    categories,
  };
}

export function checkGroupRequirements(
  grades: GradeRecord[],
  curriculum: Curriculum
): GroupRequirementStatus[] {
  return curriculum.groups.map((group) => checkGroup(grades, group));
}

/** グループをフラットなカテゴリリストに展開（後方互換用） */
export function flattenRequirements(
  groupStatuses: GroupRequirementStatus[]
): RequirementStatus[] {
  return groupStatuses.flatMap((g) => g.categories);
}

export function getTotalEarnedCredits(grades: GradeRecord[]): number {
  return grades
    .filter((g) => isPassing(g.totalGrade))
    .reduce((sum, g) => sum + g.credits, 0);
}
