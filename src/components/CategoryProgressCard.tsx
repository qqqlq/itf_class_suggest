"use client";

import { useState } from "react";
import type { GroupRequirementStatus, CourseData, CurriculumGroup } from "@/types";
import ProgressBar from "./ProgressBar";

interface CategoryProgressCardProps {
  group: GroupRequirementStatus;
  courseMaster: Record<string, CourseData>;
  curriculumGroup: CurriculumGroup;
}

function StatusIcon({ fulfilled }: { fulfilled: boolean }) {
  if (fulfilled) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold shrink-0">
        ✓
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold shrink-0">
      △
    </span>
  );
}

export default function CategoryProgressCard({
  group,
  courseMaster,
  curriculumGroup,
}: CategoryProgressCardProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const groupPercent = Math.min(
    100,
    group.minCredits > 0
      ? Math.round((group.earnedCredits / group.minCredits) * 100)
      : 100
  );

  return (
    <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* グループヘッダー */}
      <div style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusIcon fulfilled={group.fulfilled} />
            <span className="font-semibold text-lg text-primary">
              {group.groupName}
            </span>
          </div>
          <span className="font-medium text-sm text-secondary">
            {group.earnedCredits} / {group.minCredits} 単位
            {group.maxCredits != null && ` (上限${group.maxCredits})`}
          </span>
        </div>
        <ProgressBar
          percent={groupPercent}
          color={group.fulfilled ? "var(--color-success)" : "var(--color-brand)"}
          size="md"
        />
      </div>

      {/* カテゴリリスト */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {group.categories.map((req, idx) => {
          const isOpen = openCategories[req.categoryName] ?? false;
          const percent = Math.min(
            100,
            req.minCredits > 0
              ? Math.round((req.earnedCredits / req.minCredits) * 100)
              : 100
          );
          const curriculumCat = curriculumGroup.categories[idx];
          const hasDetails =
            req.matchedCourses.length > 0 || req.missingCourses.length > 0;
          const hasPrefixes =
            curriculumCat?.prefixes && curriculumCat.prefixes.length > 0;

          return (
            <div key={req.categoryName} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {/* カテゴリ行 */}
              <button
                style={{ width: '100%', textAlign: 'left', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background var(--transition-fast)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-brand-light)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => toggleCategory(req.categoryName)}
              >
                <div className="flex items-center gap-4">
                  <StatusIcon fulfilled={req.fulfilled} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-base truncate ${ req.fulfilled ? "text-secondary" : "text-primary font-medium" }`}>
                        {req.categoryName}
                      </span>
                      <span className="text-sm font-medium text-tertiary ml-2 shrink-0">
                        {req.earnedCredits} / {req.minCredits}単位
                      </span>
                    </div>
                    <ProgressBar
                      percent={percent}
                      color={req.fulfilled ? "var(--color-success)" : "var(--color-warning)"}
                      size="sm"
                    />
                  </div>
                  {(hasDetails || hasPrefixes) && (
                    <span
                      className="text-tertiary"
                      style={{ fontSize: '0.875rem', marginLeft: '0.5rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    >
                      ▾
                    </span>
                  )}
                </div>
              </button>

              {/* 展開: 科目チェックリスト */}
              {isOpen && (
                <div style={{ padding: '0 1.5rem 1rem 1.5rem', background: 'var(--color-bg)' }}>
                  <div style={{ marginLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {/* 取得済み科目 */}
                    {req.matchedCourses.map((grade) => (
                      <div key={grade.courseId} className="flex items-center gap-2">
                        <span className="text-success" style={{ fontSize: '1rem' }}>☑</span>
                        <span className="text-sm text-success font-medium">
                          {grade.courseName}
                        </span>
                        <span className="text-xs text-tertiary">
                          ({grade.credits}単位)
                        </span>
                        <span className="text-xs text-tertiary font-mono" style={{ marginLeft: 'auto' }}>
                          {grade.courseId}
                        </span>
                      </div>
                    ))}

                    {/* 未取得の必修科目 */}
                    {req.missingCourses.map((courseId) => {
                      const course = courseMaster[courseId];
                      const name = course?.name ?? courseId;
                      const credits = course?.credits;
                      return (
                        <div key={courseId} className="flex items-center gap-2">
                          <span className="text-tertiary" style={{ fontSize: '1rem' }}>☐</span>
                          <span className="text-sm text-secondary">{name}</span>
                          {credits != null && (
                            <span className="text-xs text-tertiary">
                              ({credits}単位)
                            </span>
                          )}
                          <span className="text-xs text-tertiary font-mono" style={{ marginLeft: 'auto' }}>
                            {courseId}
                          </span>
                        </div>
                      );
                    })}

                    {/* 選択科目のプレフィックス注記 */}
                    {hasPrefixes && (
                      <p className="text-xs text-tertiary" style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                        対象科目: {curriculumCat.prefixes!.join(", ")} で始まる科目
                      </p>
                    )}

                    {/* 何もなければメッセージ */}
                    {!hasDetails && !hasPrefixes && (
                      <p className="text-xs text-tertiary">
                        （取得科目なし）
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
