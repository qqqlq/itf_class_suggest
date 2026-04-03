import type {
  StudentData,
  Curriculum,
  CourseData,
  SuggestedCourse,
} from "@/types";
import { checkGroupRequirements, flattenRequirements } from "./requirementChecker";
import { buildTimetableSlots, hasConflict } from "./timetableResolver";

const MIN_ANNUAL_CREDITS = 40;

/**
 * 科目番号のプレフィックス優先度
 * GC（情報メディア創成学類向け）を最優先とし、GA（情報学群共通）より上位にする
 */
function prefixPriority(courseId: string): number {
  if (courseId.startsWith("GC")) return 0;
  if (courseId.startsWith("GA")) return 1;
  return 2;
}

/**
 * 同名の科目が複数ある場合に GC 優先で1件に絞る
 * GC がなければ GA を残す
 */
function deduplicateByName(
  entries: [string, CourseData][]
): [string, CourseData][] {
  const seen = new Map<string, [string, CourseData]>();
  for (const entry of entries) {
    const [id, course] = entry;
    const existing = seen.get(course.name);
    if (!existing || prefixPriority(id) < prefixPriority(existing[0])) {
      seen.set(course.name, entry);
    }
  }
  return Array.from(seen.values());
}

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

  const groupRequirements = checkGroupRequirements(student.grades, curriculum);
  const requirements = flattenRequirements(groupRequirements);

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
    const allCategories = curriculum.groups.flatMap((g) => g.categories);
    const category = allCategories.find((c) => c.name === req.categoryName);
    if (!category) continue;

    const filtered = Object.entries(courseMaster).filter(([id, course]) => {
      if (passedCourseIds.has(id) || addedCourseIds.has(id)) return false;
      if (course.standardYear > targetYear) return false;
      if (category.prefixes) {
        return category.prefixes.some((p) => id.startsWith(p));
      }
      if (category.courses) {
        return category.courses.includes(id);
      }
      return false;
    });

    // 同名科目が複数ある場合は GC 優先で絞り込み
    const candidates = deduplicateByName(filtered).sort(
      ([idA, a], [idB, b]) =>
        a.standardYear - b.standardYear ||
        prefixPriority(idA) - prefixPriority(idB)
    );

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
    const remaining = deduplicateByName(
      Object.entries(courseMaster).filter(([id, course]) => {
        if (passedCourseIds.has(id) || addedCourseIds.has(id)) return false;
        return course.standardYear === targetYear;
      })
    ).sort(
      ([idA, a], [idB, b]) =>
        b.credits - a.credits ||
        prefixPriority(idA) - prefixPriority(idB)
    );

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
