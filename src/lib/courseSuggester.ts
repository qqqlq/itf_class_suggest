import type {
  StudentData,
  Curriculum,
  CourseData,
  SuggestedCourse,
  KdbEntry,
} from "@/types";
import { checkGroupRequirements, flattenRequirements } from "./requirementChecker";
import { buildTimetableSlots, hasConflict } from "./timetableResolver";
import { getStandardYear, getDisplayName, findCourseIdByName, parseKdbStandardYear } from "./kdbEnricher";

/** KdBのterm文字列（"春AB" 等）をモジュールリストに変換 */
function termToModules(term: string | undefined): string[] {
  if (!term) return [];
  const season = term.match(/[春秋]/)?.[0] ?? "";
  const periods = term.match(/[A-C]/g) ?? [];
  if (!season || periods.length === 0) return [];
  return periods.map((p) => season + p);
}

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
 * KdBの日本語名を優先し、同名なら GC > GA の優先度で選ぶ
 */
function deduplicateByName(
  entries: [string, CourseData][],
  kdbDict: Record<string, KdbEntry> = {}
): [string, CourseData][] {
  const seen = new Map<string, [string, CourseData]>();
  for (const entry of entries) {
    const [id, course] = entry;
    // KdB日本語名を優先。なければ英語名（course.name）をキーに使う
    const key = kdbDict[id]?.name ?? course.name;
    const existing = seen.get(key);
    if (!existing || prefixPriority(id) < prefixPriority(existing[0])) {
      seen.set(key, entry);
    }
  }
  return Array.from(seen.values());
}

export function suggestCourses(
  student: StudentData,
  curriculum: Curriculum,
  courseMaster: Record<string, CourseData>,
  targetYear: number,
  kdbDict: Record<string, KdbEntry> = {}
): SuggestedCourse[] {
  const suggestions: SuggestedCourse[] = [];
  const addedCourseIds = new Set<string>();
  const passedCourseIds = new Set(
    student.grades
      .filter((g) => g.totalGrade !== "D")
      .map((g) => g.courseId)
  );

  // 取得済み科目の「日本語表示名」セットを構築
  // → 同一科目の別クラス（GA15131 vs GA15111）を取得済み扱いにする
  const passedCourseNames = new Set<string>();
  for (const grade of student.grades) {
    if (grade.totalGrade === "D" || grade.totalGrade === "") continue;
    // KdB名 → 科目名 → courseId の順で日本語名を取得
    const displayName = getDisplayName(grade.courseId, courseMaster, kdbDict);
    passedCourseNames.add(displayName);
    // CSVの科目名（日本語）もセットに追加
    passedCourseNames.add(grade.courseName);
  }

  const groupRequirements = checkGroupRequirements(student.grades, curriculum);
  const requirements = flattenRequirements(groupRequirements);

  function addSuggestion(
    courseId: string,
    priority: SuggestedCourse["priority"],
    reason: string,
    categoryName: string
  ) {
    if (addedCourseIds.has(courseId) || passedCourseIds.has(courseId)) return;

    // KdBの日本語名で取得済みか確認（別クラス番号の同名科目を除外）
    const displayName = getDisplayName(courseId, courseMaster, kdbDict);
    if (passedCourseNames.has(displayName)) return;

    // courseMasterになければkdbDictから最低限の情報を合成
    let course: CourseData | undefined = courseMaster[courseId];
    if (!course) {
      const kdb = kdbDict[courseId];
      if (!kdb) return;
      course = {
        name: kdb.name ?? courseId,
        credits: kdb.credits ?? 2,
        standardYear: parseKdbStandardYear(kdb.standardYear) ?? 1,
        modules: termToModules(kdb.term),
        dayPeriod: "",
        category: kdb.kdbCategory ?? "",
        prefixes: [],
        prerequisites: [],
        instructor: "",
      };
    }

    // 時間割の衝突チェック
    const currentSlots = buildTimetableSlots(suggestions);
    if (hasConflict(course, currentSlots)) return;

    addedCourseIds.add(courseId);
    suggestions.push({
      course: { ...course, id: courseId, name: displayName },
      priority,
      reason,
      categoryName,
    });
  }

  // Phase 1: 取り逃がした必修科目（標準年次が currentYear 以下）を最優先
  for (const req of requirements) {
    if (req.type !== "required") continue;
    for (const missingItem of req.missingCourses) {
      // missingCourses は courseId の場合も courseName の場合もある
      // （courseNames で定義されたカテゴリでは名前が入る）
      const courseId = courseMaster[missingItem]
        ? missingItem
        : (findCourseIdByName(missingItem, courseMaster, kdbDict) ?? null);
      if (!courseId) continue;

      const stdYear = getStandardYear(courseId, courseMaster, kdbDict);
      if (stdYear <= targetYear) {
        const isOverdue = stdYear < targetYear;
        addSuggestion(
          courseId,
          "highest",
          isOverdue ? `必修・取り逃がし（${stdYear}年次配当）` : "必修（未取得）",
          req.categoryName
        );
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

  // Phase 3: 選択科目の推薦（該当学年のもの優先）
  const electiveReqs = requirements
    .filter((r) => r.type === "elective" && !r.fulfilled)
    .sort((a, b) => (b.minCredits - b.earnedCredits) - (a.minCredits - a.earnedCredits));

  for (const req of electiveReqs) {
    const allCategories = curriculum.groups.flatMap((g) => g.categories);
    const category = allCategories.find((c) => c.name === req.categoryName);
    if (!category) continue;

    const filtered = Object.entries(courseMaster).filter(([id, course]) => {
      if (passedCourseIds.has(id) || addedCourseIds.has(id)) return false;
      const stdYear = getStandardYear(id, courseMaster, kdbDict);
      if (stdYear > targetYear) return false;
      if (category.prefixes) {
        return category.prefixes.some((p) => id.startsWith(p));
      }
      if (category.courses) {
        return category.courses.includes(id);
      }
      return false;
    });

    // 同名科目が複数ある場合は GC 優先で絞り込み（KdB日本語名ベース）
    const candidates = deduplicateByName(filtered, kdbDict).sort(
      ([idA, a], [idB, b]) => {
        const ya = getStandardYear(idA, courseMaster, kdbDict);
        const yb = getStandardYear(idB, courseMaster, kdbDict);
        return ya - yb || prefixPriority(idA) - prefixPriority(idB);
      }
    );

    for (const [courseId] of candidates) {
      if (req.earnedCredits + sumSuggestedCredits(suggestions, req.categoryName) >= req.minCredits) {
        break;
      }
      addSuggestion(courseId, "medium", "カテゴリ充足", req.categoryName);
    }
  }

  // Phase 4: 40単位以上確保（該当学年の科目で補填）
  const totalSuggested = suggestions.reduce((sum, s) => sum + s.course.credits, 0);
  if (totalSuggested < MIN_ANNUAL_CREDITS) {
    const remaining = deduplicateByName(
      Object.entries(courseMaster).filter(([id]) => {
        if (passedCourseIds.has(id) || addedCourseIds.has(id)) return false;
        const displayName = getDisplayName(id, courseMaster, kdbDict);
        if (passedCourseNames.has(displayName)) return false;
        const stdYear = getStandardYear(id, courseMaster, kdbDict);
        return stdYear === targetYear;
      }),
      kdbDict
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
