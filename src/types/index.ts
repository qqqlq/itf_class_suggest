// TWINS CSVから読み取った成績レコード
export interface GradeRecord {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  credits: number;
  springGrade: string;
  autumnGrade: string;
  totalGrade: string;
  category: string; // B, C, C0
  year: number;
  offering: string;
}

// パース済みの学生データ
export interface StudentData {
  studentId: string;
  studentName: string;
  enrollmentYear: number;
  currentYear: number;
  grades: GradeRecord[];
  earnedCredits: number;
  gpa: number;
  failedCourses: GradeRecord[];
}

// カリキュラム定義
export interface Curriculum {
  id: string;
  name: string;
  gakugun: string;
  totalCreditsRequired: number;
  annualCreditCap: number;
  annualCreditCapExtended: number;
  promotionRequirements: {
    year3to4: { minCredits: number };
  };
  categories: CurriculumCategory[];
}

export interface CurriculumCategory {
  name: string;
  type: "required" | "elective";
  minCredits: number;
  maxCredits?: number;
  courses?: string[]; // 科目番号リスト
  prefixes?: string[]; // 科目番号プレフィックス
  description?: string;
}

// 科目マスタ（JSON上のデータ、idなし）
export interface CourseData {
  name: string;
  credits: number;
  standardYear: number;
  modules: string[];
  dayPeriod: string;
  category: string;
  prefixes: string[];
  prerequisites: string[];
  instructor: string;
}

// 科目（idを含む、ランタイム用）
export interface Course extends CourseData {
  id: string;
}

// 卒業要件の充足状況
export interface RequirementStatus {
  categoryName: string;
  type: "required" | "elective";
  earnedCredits: number;
  minCredits: number;
  maxCredits?: number;
  fulfilled: boolean;
  missingCourses: string[]; // 未取得の必修科目ID
  matchedCourses: GradeRecord[]; // 取得済み科目
}

// サジェスト結果
export interface SuggestedCourse {
  course: Course;
  priority: "highest" | "high" | "medium" | "low";
  reason: string;
  categoryName: string;
}

// 時間割のスロット
export interface TimetableSlot {
  day: string; // 月, 火, 水, 木, 金
  period: number; // 1-6
  module: string; // 春A, 春B, etc.
  course: SuggestedCourse;
}

// 時間割の衝突情報
export interface TimetableConflict {
  day: string;
  period: number;
  module: string;
  courses: (Course | CourseData)[];
}
