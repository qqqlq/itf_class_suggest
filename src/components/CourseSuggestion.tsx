"use client";

import type { SuggestedCourse } from "@/types";

interface CourseSuggestionProps {
  suggestions: SuggestedCourse[];
}

const PRIORITY_LABELS: Record<SuggestedCourse["priority"], string> = {
  highest: "最優先",
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_BADGE: Record<SuggestedCourse["priority"], string> = {
  highest: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function CourseSuggestion({ suggestions }: CourseSuggestionProps) {
  const totalCredits = suggestions.reduce((sum, s) => sum + s.course.credits, 0);
  const creditStatus =
    totalCredits > 45
      ? { color: "text-red-600", note: "⚠ 上限超過" }
      : totalCredits >= 40
      ? { color: "text-emerald-600", note: "" }
      : { color: "text-amber-600", note: "⚠ 40単位未満" };

  return (
    <div className="space-y-4">
      {/* 概要バー */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">サジェスト科目一覧</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">提案合計:</span>
          <span className={`font-bold ${creditStatus.color}`}>{totalCredits} 単位</span>
          {creditStatus.note && (
            <span className={`text-xs font-medium ${creditStatus.color}`}>
              {creditStatus.note}
            </span>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">優先度</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">科目番号</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">科目名</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">単位</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">曜日時限</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">モジュール</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">理由</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suggestions.map((s, idx) => (
              <tr
                key={s.course.id}
                className={`hover:bg-slate-50 transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                }`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-block text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                      PRIORITY_BADGE[s.priority]
                    }`}
                  >
                    {PRIORITY_LABELS[s.priority]}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                  {s.course.id}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-800">
                  {s.course.name}
                </td>
                <td className="px-3 py-2.5 text-center text-slate-600">
                  {s.course.credits}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{s.course.dayPeriod}</td>
                <td className="px-3 py-2.5 text-xs text-slate-500">
                  {s.course.modules.join(", ")}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
