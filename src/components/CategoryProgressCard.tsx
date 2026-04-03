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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* グループヘッダー */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon fulfilled={group.fulfilled} />
            <span className="font-semibold text-sm text-slate-800">
              {group.groupName}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {group.earnedCredits} / {group.minCredits} 単位
            {group.maxCredits != null && ` (上限${group.maxCredits})`}
          </span>
        </div>
        <ProgressBar
          percent={groupPercent}
          color={group.fulfilled ? "bg-emerald-500" : "bg-amber-400"}
          size="md"
        />
      </div>

      {/* カテゴリリスト */}
      <div className="divide-y divide-slate-100">
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
            <div key={req.categoryName}>
              {/* カテゴリ行 */}
              <button
                className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors"
                onClick={() => toggleCategory(req.categoryName)}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon fulfilled={req.fulfilled} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-sm truncate ${
                          req.fulfilled ? "text-slate-700" : "text-slate-800 font-medium"
                        }`}
                      >
                        {req.categoryName}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 shrink-0">
                        {req.earnedCredits} / {req.minCredits}単位
                      </span>
                    </div>
                    <ProgressBar
                      percent={percent}
                      color={req.fulfilled ? "bg-emerald-400" : "bg-amber-300"}
                      size="sm"
                    />
                  </div>
                  {(hasDetails || hasPrefixes) && (
                    <span
                      className={`text-slate-400 text-xs ml-1 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  )}
                </div>
              </button>

              {/* 展開: 科目チェックリスト */}
              {isOpen && (
                <div className="px-5 pb-3 bg-slate-50">
                  <div className="ml-8 space-y-1">
                    {/* 取得済み科目 */}
                    {req.matchedCourses.map((grade) => (
                      <div
                        key={grade.courseId}
                        className="flex items-center gap-2 py-0.5"
                      >
                        <span className="text-emerald-500 text-sm">☑</span>
                        <span className="text-sm text-emerald-700">
                          {grade.courseName}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({grade.credits}単位)
                        </span>
                        <span className="text-xs text-slate-300 font-mono ml-auto">
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
                        <div
                          key={courseId}
                          className="flex items-center gap-2 py-0.5"
                        >
                          <span className="text-slate-300 text-sm">☐</span>
                          <span className="text-sm text-slate-500">{name}</span>
                          {credits != null && (
                            <span className="text-xs text-slate-400">
                              ({credits}単位)
                            </span>
                          )}
                          <span className="text-xs text-slate-300 font-mono ml-auto">
                            {courseId}
                          </span>
                        </div>
                      );
                    })}

                    {/* 選択科目のプレフィックス注記 */}
                    {hasPrefixes && (
                      <p className="text-xs text-slate-400 pt-1 border-t border-slate-200 mt-2">
                        対象科目: {curriculumCat.prefixes!.join(", ")} で始まる科目
                      </p>
                    )}

                    {/* 何もなければメッセージ */}
                    {!hasDetails && !hasPrefixes && (
                      <p className="text-xs text-slate-400">
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
