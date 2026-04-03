import Papa from "papaparse";
import type { GradeRecord, StudentData } from "@/types";

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.3,
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 0,
};

function isPassing(grade: string): boolean {
  return grade === "A+" || grade === "A" || grade === "B" || grade === "C" || grade === "P";
}

export function parseTwinsCSV(
  csvText: string,
  kdbDict?: Record<string, { standardYear?: string; kdbCategory?: string }>
): StudentData {
  const result = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = result.data as string[][];
  // skip header row
  const dataRows = rows.slice(1);

  const grades: GradeRecord[] = dataRows
    .filter((row) => row.length >= 11 && row[0].trim())
    .map((row) => {
      const courseId = row[2].trim().replace(/"/g, "");
      const kdbInfo = kdbDict ? kdbDict[courseId] : undefined;
      
      return {
        studentId: row[0].trim().replace(/"/g, ""),
        studentName: row[1].trim().replace(/"/g, ""),
        courseId,
        courseName: row[3].trim().replace(/"/g, ""),
        credits: parseFloat(row[4].trim().replace(/"/g, "")),
        springGrade: row[5].trim().replace(/"/g, ""),
        autumnGrade: row[6].trim().replace(/"/g, ""),
        totalGrade: row[7].trim().replace(/"/g, ""),
        category: row[8].trim().replace(/"/g, ""),
        year: parseInt(row[9].trim().replace(/"/g, ""), 10),
        offering: row[10].trim().replace(/"/g, ""),
        standardYear: kdbInfo?.standardYear,
        kdbCategory: kdbInfo?.kdbCategory,
      };
    });

  if (grades.length === 0) {
    throw new Error("CSVにデータが含まれていません");
  }

  const studentId = grades[0].studentId;
  const studentName = grades[0].studentName;

  // 学籍番号から入学年度を推定（例: 202510069 → 2025）
  const enrollmentYear = parseInt(studentId.substring(0, 4), 10);
  const currentAcademicYear = 2026; // TODO: 動的に取得
  const currentYear = currentAcademicYear - enrollmentYear + 1;

  const passingGrades = grades.filter((g) => isPassing(g.totalGrade));
  const earnedCredits = passingGrades.reduce((sum, g) => sum + g.credits, 0);

  // GPA計算（P評価は除外）
  const gpaGrades = grades.filter((g) => GRADE_POINTS[g.totalGrade] !== undefined);
  const totalGradePoints = gpaGrades.reduce(
    (sum, g) => sum + GRADE_POINTS[g.totalGrade] * g.credits,
    0
  );
  const totalGpaCredits = gpaGrades.reduce((sum, g) => sum + g.credits, 0);
  const gpa = totalGpaCredits > 0 ? totalGradePoints / totalGpaCredits : 0;

  const failedCourses = grades.filter((g) => g.totalGrade === "D");

  return {
    studentId,
    studentName,
    enrollmentYear,
    currentYear,
    grades,
    earnedCredits,
    gpa: Math.round(gpa * 100) / 100,
    failedCourses,
  };
}
