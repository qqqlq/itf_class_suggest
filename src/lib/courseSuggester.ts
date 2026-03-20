import type {
  StudentData,
  Curriculum,
  CourseData,
  SuggestedCourse,
} from "@/types";
import { checkRequirements } from "./requirementChecker";
import { buildTimetableSlots, hasConflict } from "./timetableResolver";

const MIN_ANNUAL_CREDITS = 40;

export function suggestCourses(
  student: StudentData,
  curriculum: Curriculum,
  courseMaster: Record<string, CourseData>,
  targetYear: number
): SuggestedCourse[] {
  const suggestions: SuggestedCourse[] = [];
  const addedCourseIds = new Set<string>();
  const passedCourseIds = new Set(
    student.grades
      .filter((g) => g.totalGrade !== "D")
      .map((g) => g.courseId)
  );

  const requirements = checkRequirements(student.grades, curriculum);

  function addSuggestion(
    courseId: string,
    priority: SuggestedCourse["priority"],
    reason: string,
    categoryName: string
  ) {
    if (addedCourseIds.has(courseId) || passedCourseIds.has(courseId)) return;
    const course = courseMaster[courseId];
    if (!course) return;

    // 時間割の衝突チェック
    const currentSlots = buildTimetableSlots(suggestions);
    if (hasConflict(course, currentSlots)) return;

    addedCourseIds.add(courseId);
    suggestions.push({
      course: { ...course, id: courseId },
      priority,
      reason,
      categoryName,
    });
  }

  // Phase 1: 必修科目の自動追加
  for (const req of requirements) {
    if (req.type !== "required") continue;
    for (const courseId of req.missingCourses) {
      const course = courseMaster[courseId];
      if (course && course.standardYear <= targetYear) {
        addSuggestion(courseId, "highest", "必修（未取得）", req.categoryName);
      }
    }
  }

  // Phase 2: 不合格科目の再履修
  for (const failed of student.failedCourses) {
    if (courseMaster[failed.courseId]) {
      addSuggestion(
        failed.courseId,
        "high",
        "再履修（D評価）",
        "再履修"
      );
    }
  }

  // Phase 3: 選択科目の推薦
  const electiveReqs = requirements
    .filter((r) => r.type === "elective" && !r.fulfilled)
    .sort((a, b) => (b.minCredits - b.earnedCredits) - (a.minCredits - a.earnedCredits));

  for (const req of electiveReqs) {
    const category = curriculum.categories.find((c) => c.name === req.categoryName);
    if (!category) continue;

    const candidates = Object.entries(courseMaster)
      .filter(([id, course]) => {
        if (passedCourseIds.has(id) || addedCourseIds.has(id)) return false;
        if (course.standardYear > targetYear) return false;
        // プレフィックスマッチ
        if (category.prefixes) {
          return category.prefixes.some((p) => id.startsWith(p));
        }
        if (category.courses) {
          return category.courses.includes(id);
        }
        return false;
      })
      .sort(([, a], [, b]) => a.standardYear - b.standardYear);

    for (const [courseId] of candidates) {
      if (req.earnedCredits + sumSuggestedCredits(suggestions, req.categoryName) >= req.minCredits) {
        break;
      }
      addSuggestion(courseId, "medium", "カテゴリ充足", req.categoryName);
    }
  }

  // Phase 4: 40単位以上確保
  const totalSuggested = suggestions.reduce((sum, s) => sum + s.course.credits, 0);
  if (totalSuggested < MIN_ANNUAL_CREDITS) {
    const remaining = Object.entries(courseMaster)
      .filter(([id, course]) => {
        if (passedCourseIds.has(id) || addedCourseIds.has(id)) return false;
        return course.standardYear === targetYear;
      })
      .sort(([, a], [, b]) => b.credits - a.credits);

    for (const [courseId] of remaining) {
      if (
        suggestions.reduce((sum, s) => sum + s.course.credits, 0) >= MIN_ANNUAL_CREDITS
      ) {
        break;
      }
      addSuggestion(courseId, "low", "単位数確保", "自由選択");
    }
  }

  // 45単位超の警告は呼び出し側で処理
  return suggestions;
}

function sumSuggestedCredits(
  suggestions: SuggestedCourse[],
  categoryName: string
): number {
  return suggestions
    .filter((s) => s.categoryName === categoryName)
    .reduce((sum, s) => sum + s.course.credits, 0);
}
