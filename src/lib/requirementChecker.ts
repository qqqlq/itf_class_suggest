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
  if (category.excludePrefixes?.some((prefix) => grade.courseId.startsWith(prefix))) {
    return false;
  }
  if (category.courses?.includes(grade.courseId)) return true;
  if (category.prefixes?.some((prefix) => grade.courseId.startsWith(prefix))) return true;
  if (category.courseNames?.includes(grade.courseName)) return true;
  if (category.namePrefixes?.some((prefix) => grade.courseName.startsWith(prefix))) return true;
  return false;
}

export function checkGroupRequirements(
  grades: GradeRecord[],
  curriculum: Curriculum
): GroupRequirementStatus[] {
  // 1. 各成績をトラッキングするための管理オブジェクトを作成
  const availableGrades = new Set(grades.filter(g => isPassing(g.totalGrade)));

  // 中間結果を保持するデータ構造
  const resultsByGroup: Record<number, Record<number, RequirementStatus>> = {};
  
  // 2. 評価順序の決定: すべての 'required' を先に、次に 'elective' を評価
  const evalQueue: { gIdx: number; cIdx: number; cat: CurriculumCategory }[] = [];
  
  curriculum.groups.forEach((group, gIdx) => {
    resultsByGroup[gIdx] = {};
    group.categories.forEach((cat, cIdx) => {
      // プレースホルダー作成
      resultsByGroup[gIdx][cIdx] = {
        categoryName: cat.name,
        type: cat.type,
        earnedCredits: 0,
        minCredits: cat.minCredits,
        maxCredits: cat.maxCredits,
        fulfilled: false,
        missingCourses: [],
        matchedCourses: [],
      };
      evalQueue.push({ gIdx, cIdx, cat });
    });
  });

  // 'required' -> 'elective' -> 'free' の順にソート
  const typeOrder = { required: 0, elective: 1, free: 2 };
  evalQueue.sort((a, b) => typeOrder[a.cat.type] - typeOrder[b.cat.type]);

  // 3. 順番通りに判定
  evalQueue.forEach(({ gIdx, cIdx, cat }) => {
    const matched: GradeRecord[] = [];
    
    // 利用可能な成績からマッチするものを取得
    for (const grade of Array.from(availableGrades)) {
      if (matchesCourse(grade, cat)) {
        matched.push(grade);
        availableGrades.delete(grade); // カテゴリに充当されたため、以降の判定から除外
      }
    }

    const earnedCredits = matched.reduce((sum, g) => sum + g.credits, 0);
    const missingCourses: string[] = [];

    // 必修科目の未取得チェック
    if (cat.courses) {
      for (const courseId of cat.courses) {
        if (!matched.some((g) => g.courseId === courseId)) {
          missingCourses.push(courseId);
        }
      }
    }
    if (cat.courseNames) {
      for (const courseName of cat.courseNames) {
        if (!matched.some((g) => g.courseName === courseName)) {
           // IDではなく名前をmissingとして追加 (UI側で名前としてそのまま表示される)
          missingCourses.push(courseName);
        }
      }
    }

    resultsByGroup[gIdx][cIdx].earnedCredits = earnedCredits;
    resultsByGroup[gIdx][cIdx].fulfilled = earnedCredits >= cat.minCredits;
    resultsByGroup[gIdx][cIdx].missingCourses = missingCourses;
    resultsByGroup[gIdx][cIdx].matchedCourses = matched;
  });

  // 4. グループごとの最終結果を構築
  const finalGroups = curriculum.groups.map((group, gIdx) => {
    const categories = group.categories.map((_, cIdx) => resultsByGroup[gIdx][cIdx]);
    const groupEarned = categories.reduce((sum, cat) => sum + cat.earnedCredits, 0);

    return {
      groupName: group.name,
      earnedCredits: groupEarned,
      minCredits: group.minCredits,
      maxCredits: group.maxCredits,
      fulfilled: groupEarned >= group.minCredits,
      categories,
    };
  });

  // 5. 分類漏れの科目をまとめる (Unclassified / Unknown)
  const unclassifiedMatched = Array.from(availableGrades);
  if (unclassifiedMatched.length > 0) {
    const unclassifiedEarned = unclassifiedMatched.reduce((sum, g) => sum + g.credits, 0);
    finalGroups.push({
      groupName: "その他・未分類",
      earnedCredits: unclassifiedEarned,
      minCredits: 0,
      maxCredits: undefined,
      fulfilled: true,
      categories: [
        {
          categoryName: "マスタ未定義・要件外の科目",
          type: "free",
          earnedCredits: unclassifiedEarned,
          minCredits: 0,
          maxCredits: undefined,
          fulfilled: true,
          missingCourses: [],
          matchedCourses: unclassifiedMatched,
        }
      ]
    });
  }

  return finalGroups;
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
