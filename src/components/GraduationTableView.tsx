import type {
  GroupRequirementStatus,
  Curriculum,
  CourseData,
  RequirementStatus,
  CurriculumCategory,
} from "@/types";

interface GraduationTableViewProps {
  groupRequirements: GroupRequirementStatus[];
  curriculum: Curriculum;
  courseMaster: Record<string, CourseData>;
}

interface CourseCell {
  id: string;
  name: string;
  credits: number;
  completed: boolean;
}

function buildCourseCells(
  req: RequirementStatus,
  cat: CurriculumCategory,
  courseMaster: Record<string, CourseData>
): CourseCell[] {
  const cells: CourseCell[] = [];
  const completedIds = new Set(req.matchedCourses.map((g) => g.courseId));

  // 取得済み科目（必ず表示）
  req.matchedCourses.forEach((grade) => {
    cells.push({
      id: grade.courseId,
      name: grade.courseName,
      credits: grade.credits,
      completed: true,
    });
  });

  // 必修科目の未取得分
  if (cat.type === "required" && req.missingCourses.length > 0) {
    req.missingCourses.forEach((courseId) => {
      if (!completedIds.has(courseId)) {
        const course = courseMaster[courseId];
        cells.push({
          id: courseId,
          name: course?.name ?? courseId,
          credits: course?.credits ?? 0,
          completed: false,
        });
      }
    });
  }

  return cells;
}

interface ColumnProps {
  groupName: string;
  req: RequirementStatus;
  cat: CurriculumCategory;
  cells: CourseCell[];
  isLast: boolean;
}

function Column({ groupName, req, cat, cells, isLast }: ColumnProps) {
  const creditLabel = cat.maxCredits != null
    ? `${req.earnedCredits}/${cat.minCredits}〜${cat.maxCredits}単位`
    : `${req.earnedCredits}/${cat.minCredits}単位`;

  return (
    <div className={`flex flex-col min-w-[160px] ${!isLast ? "border-r border-slate-200" : ""}`}>
      {/* カラムヘッダー */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-600 truncate">{groupName}</div>
        <div className="text-xs text-slate-400 truncate">{req.categoryName}</div>
        <div className={`text-xs font-medium mt-0.5 ${req.fulfilled ? "text-emerald-600" : "text-amber-600"}`}>
          {creditLabel}
          {req.fulfilled && " ✓"}
        </div>
      </div>

      {/* 科目セル */}
      <div className="flex-1 divide-y divide-slate-100">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`px-3 py-2 ${
              cell.completed
                ? "bg-emerald-50 border-l-4 border-emerald-400"
                : "bg-white border-l-4 border-slate-100"
            }`}
          >
            <div
              className={`text-xs leading-snug ${
                cell.completed ? "text-emerald-800" : "text-slate-400"
              }`}
            >
              {cell.completed ? "☑" : "☐"} {cell.name}
            </div>
            <div className={`text-xs mt-0.5 ${cell.completed ? "text-emerald-500" : "text-slate-300"}`}>
              {cell.credits > 0 && `${cell.credits}単位`}
              <span className="font-mono ml-1">{cell.id}</span>
            </div>
          </div>
        ))}
        {cells.length === 0 && (
          <div className="px-3 py-4 text-xs text-slate-300 italic">
            {cat.prefixes && cat.prefixes.length > 0
              ? `${cat.prefixes.join(", ")} で始まる科目`
              : "科目なし"}
          </div>
        )}
      </div>

      {/* プレフィックス注記 */}
      {cat.prefixes && cat.prefixes.length > 0 && cells.length > 0 && (
        <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">
            対象: {cat.prefixes.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GraduationTableView({
  groupRequirements,
  curriculum,
  courseMaster,
}: GraduationTableViewProps) {
  // 全カテゴリを一覧化
  const columns: {
    groupName: string;
    req: RequirementStatus;
    cat: CurriculumCategory;
    cells: CourseCell[];
  }[] = [];

  groupRequirements.forEach((group, gIdx) => {
    const curriculumGroup = curriculum.groups[gIdx];
    group.categories.forEach((req, cIdx) => {
      const cat = curriculumGroup?.categories[cIdx];
      if (!cat) return;
      const cells = buildCourseCells(req, cat, courseMaster);
      columns.push({ groupName: group.groupName, req, cat, cells });
    });
  });

  const totalEarned = groupRequirements.reduce((s, g) => s + g.earnedCredits, 0);
  const totalRequired = curriculum.totalCreditsRequired;
  const totalPercent = Math.min(100, Math.round((totalEarned / totalRequired) * 100));

  return (
    <div className="space-y-4">
      {/* 合計バー */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-slate-700">卒業要件合計</span>
          <span className="text-slate-500">
            {totalEarned} / {totalRequired} 単位 ({totalPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${totalPercent}%` }}
          />
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {columns.map((col, idx) => (
              <Column
                key={`${col.groupName}-${col.req.categoryName}`}
                groupName={col.groupName}
                req={col.req}
                cat={col.cat}
                cells={col.cells}
                isLast={idx === columns.length - 1}
              />
            ))}
          </div>
        </div>

        {/* グループ別合計フッター */}
        <div className="border-t border-slate-200 bg-slate-50 flex min-w-max overflow-x-auto">
          {groupRequirements.map((group, gIdx) => {
            const curriculumGroup = curriculum.groups[gIdx];
            const catCount = group.categories.length;
            const groupPercent = Math.min(
              100,
              group.minCredits > 0
                ? Math.round((group.earnedCredits / group.minCredits) * 100)
                : 100
            );
            return (
              <div
                key={group.groupName}
                className="px-3 py-2 border-r border-slate-200"
                style={{ minWidth: `${catCount * 160}px` }}
              >
                <div className="text-xs font-semibold text-slate-600">
                  {group.groupName}
                </div>
                <div className={`text-xs font-medium ${group.fulfilled ? "text-emerald-600" : "text-amber-600"}`}>
                  {group.earnedCredits}/{group.minCredits}単位
                  {group.maxCredits != null && ` (上限${group.maxCredits})`}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full ${group.fulfilled ? "bg-emerald-500" : "bg-amber-400"}`}
                    style={{ width: `${groupPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 px-1">
        ※ 緑のセルは取得済み科目、グレーは未取得。選択科目欄は取得済みのみ表示。
      </p>
    </div>
  );
}
