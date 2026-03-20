"use client";

import type { RequirementStatus, StudentData } from "@/types";

interface ProgressDashboardProps {
  student: StudentData;
  requirements: RequirementStatus[];
  totalRequired: number;
}

export default function ProgressDashboard({
  student,
  requirements,
  totalRequired,
}: ProgressDashboardProps) {
  const overallPercent = Math.min(
    100,
    Math.round((student.earnedCredits / totalRequired) * 100)
  );

  return (
    <div className="space-y-6">
      {/* 学生情報サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="氏名" value={student.studentName} />
        <StatCard label="年次" value={`${student.currentYear}年次`} />
        <StatCard
          label="取得単位数"
          value={`${student.earnedCredits} / ${totalRequired}`}
        />
        <StatCard label="GPA" value={student.gpa.toFixed(2)} />
      </div>

      {/* 全体進捗 */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">卒業要件全体</span>
          <span>
            {student.earnedCredits} / {totalRequired} 単位 ({overallPercent}%)
          </span>
        </div>
        <ProgressBar percent={overallPercent} color="bg-blue-600" />
      </div>

      {/* カテゴリ別 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">カテゴリ別充足状況</h3>
        {requirements.map((req) => {
          const percent = Math.min(
            100,
            Math.round((req.earnedCredits / req.minCredits) * 100)
          );
          return (
            <div key={req.categoryName}>
              <div className="flex justify-between text-sm mb-1">
                <span className={req.fulfilled ? "text-gray-700" : "text-red-600 font-medium"}>
                  {req.categoryName}
                  {!req.fulfilled && " ⚠"}
                </span>
                <span>
                  {req.earnedCredits} / {req.minCredits} 単位
                </span>
              </div>
              <ProgressBar
                percent={percent}
                color={req.fulfilled ? "bg-green-500" : "bg-amber-500"}
              />
              {req.missingCourses.length > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  未取得: {req.missingCourses.join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 不合格科目 */}
      {student.failedCourses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-700 font-semibold mb-2">不合格科目（D評価）</h3>
          <ul className="text-sm text-red-600 space-y-1">
            {student.failedCourses.map((f) => (
              <li key={f.courseId}>
                {f.courseId} {f.courseName} ({f.credits}単位)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
