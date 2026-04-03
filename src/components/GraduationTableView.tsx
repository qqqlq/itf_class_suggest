import type {
  GroupRequirementStatus,
  Curriculum,
  CourseData,
  RequirementStatus,
  CurriculumCategory,
  StudentData,
} from "@/types";

interface GraduationTableViewProps {
  student: StudentData;
  groupRequirements: GroupRequirementStatus[];
  curriculum: Curriculum;
  courseMaster: Record<string, CourseData>;
}

interface CourseCell {
  id: string;
  name: string;
  credits: number;
  completed: boolean;
  score?: string; // e.g. A+, A, B, C, P
  standardYear?: number;
  isUrgent?: boolean;
}

function buildCourseCells(
  req: RequirementStatus,
  cat: CurriculumCategory,
  courseMaster: Record<string, CourseData>,
  currentYear: number
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
      score: grade.totalGrade,
    });
  });

  // 必修科目の未取得分
  if (cat.type === "required" && req.missingCourses.length > 0) {
    req.missingCourses.forEach((courseIdOrName) => {
      if (!completedIds.has(courseIdOrName)) {
        let courseData: CourseData | undefined = courseMaster[courseIdOrName];
        let foundId = courseData ? courseIdOrName : undefined;

        if (!courseData) {
          for (const [key, value] of Object.entries(courseMaster)) {
            if (value.name === courseIdOrName) {
              courseData = value;
              foundId = key;
              break;
            }
          }
        }

        const standardYear = courseData?.standardYear ?? 1;
        const isUrgent = standardYear <= currentYear;
        
        cells.push({
          id: foundId ?? "",
          name: courseData?.name ?? courseIdOrName,
          credits: courseData?.credits ?? 0,
          completed: false,
          standardYear,
          isUrgent,
        });
      }
    });
  }

  // 選択科目等の未取得分（不足単位数の可視化）
  if (cat.minCredits > 0 && req.earnedCredits < cat.minCredits && cat.type !== "required") {
    const missingCredits = cat.minCredits - req.earnedCredits;
    cells.push({
      id: `missing-elective`,
      name: `(他の科目で補填が必要)`,
      credits: missingCredits,
      completed: false,
      isUrgent: false,
    });
  }

  return cells;
}

interface ColumnProps {
  groupName: string;
  req: RequirementStatus;
  cat: CurriculumCategory;
  cells: CourseCell[];
}

function Column({ groupName, req, cat, cells }: ColumnProps) {
  const creditLabel = cat.maxCredits != null
    ? `${req.earnedCredits}/${cat.minCredits}〜${cat.maxCredits}単位`
    : `${req.earnedCredits}/${cat.minCredits}単位`;

  return (
    <div className="course-column glass-panel" style={{ padding: '1rem', flexShrink: 0 }}>
      {/* カラムヘッダー */}
      <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div className="text-xs font-semibold text-secondary" style={{ marginBottom: '0.25rem' }}>{groupName}</div>
        <div className="text-sm font-bold text-primary">{req.categoryName}</div>
        <div className={`text-xs font-medium mt-2 ${req.fulfilled ? "text-success" : "text-warning"}`}>
          {creditLabel}
          {req.fulfilled && " ✓"}
        </div>
      </div>

      {/* 科目セル (Excel風) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`course-cell ${cell.completed ? 'course-cell-acquired' : 'course-cell-unacquired'}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <div className={`text-sm font-semibold ${cell.completed ? "text-success" : (cell.isUrgent ? "text-danger" : "text-secondary")}`}>
                   {cell.name}
                 </div>
                 {!cell.completed && cell.isUrgent && (
                   <span style={{ fontSize: '0.65rem', padding: '0.125rem 0.25rem', background: 'var(--color-danger)', color: '#fff', borderRadius: '4px', alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                     {cell.standardYear}年次配当・要履修
                   </span>
                 )}
               </div>
               {cell.completed && cell.score && (
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'rgba(255,255,255,0.7)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}>
                   {cell.score}
                 </span>
               )}
            </div>
            
            <div className={`text-xs ${cell.completed ? "text-success" : "text-tertiary"}`} style={{ opacity: 0.8, display: 'flex', justifyContent: 'space-between' }}>
              <span>{cell.credits > 0 ? `${cell.credits}単位` : ''}</span>
              <span className="font-mono">{cell.id}</span>
            </div>
          </div>
        ))}
        {cells.length === 0 && (
          <div className="course-cell course-cell-unacquired" style={{ opacity: 0.5 }}>
            <div className="text-xs text-tertiary text-center">
              {cat.prefixes && cat.prefixes.length > 0
                ? `${cat.prefixes.join(", ")} で始まる科目`
                : "科目なし"}
            </div>
          </div>
        )}
      </div>

      {/* プレフィックス注記 */}
      {cat.prefixes && cat.prefixes.length > 0 && cells.length > 0 && (
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <p className="text-xs text-tertiary">
            対象: {cat.prefixes.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GraduationTableView({
  student,
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
    // 最後の 'その他・未分類' グループなど、curriculumに存在しない場合はダミーで対応
    const curriculumGroup = curriculum.groups[gIdx];
    
    group.categories.forEach((req, cIdx) => {
      let cat = curriculumGroup?.categories[cIdx];
      // 動的生成された未分類グループ用のダミーカテゴリ
      if (!cat && group.groupName === "その他・未分類") {
        cat = {
          name: req.categoryName,
          type: req.type,
          minCredits: 0,
        };
      }
      
      if (!cat) return;
      const cells = buildCourseCells(req, cat, courseMaster, student.currentYear);
      columns.push({ groupName: group.groupName, req, cat, cells });
    });
  });

  const totalEarned = groupRequirements.reduce((s, g) => s + g.earnedCredits, 0);
  const totalRequired = curriculum.totalCreditsRequired;
  const totalPercent = Math.min(100, Math.round((totalEarned / totalRequired) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 合計バー */}
      <div className="bento-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span className="font-semibold text-primary">卒業要件合計</span>
          <span className="text-secondary text-sm font-medium">
            {totalEarned} / {totalRequired} 単位 ({totalPercent}%)
          </span>
        </div>
        <div style={{ width: '100%', background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
          <div
            style={{ width: `${totalPercent}%`, background: 'linear-gradient(to right, var(--color-brand), #c457f9)', height: '100%', transition: 'width var(--transition-normal)' }}
          />
        </div>
      </div>

      {/* テーブル (Excelライクなカードグリッド) */}
      <div className="course-grid">
        {columns.map((col, idx) => (
          <Column
            key={`${col.groupName}-${col.req.categoryName}`}
            groupName={col.groupName}
            req={col.req}
            cat={col.cat}
            cells={col.cells}
          />
        ))}
      </div>

      <p className="text-xs text-tertiary" style={{ padding: '0 0.5rem' }}>
        ※ 緑のセルは取得済み科目、グループの背景を白にし見やすく設定しました。<br/>
        ※ 未取得はグレーの枠のみ。赤いバッジは現在（またはそれ以前）の学年が標準履修年次となっている未修得の必修科目です。
      </p>
    </div>
  );
}
