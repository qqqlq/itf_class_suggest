"use client";

import type { SuggestedCourse } from "@/types";

interface CourseSuggestionProps {
  suggestions: SuggestedCourse[];
  currentYear: number;
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

export default function CourseSuggestion({ suggestions, currentYear }: CourseSuggestionProps) {
  const totalCredits = suggestions.reduce((sum, s) => sum + s.course.credits, 0);
  const creditStatus =
    totalCredits > 45
      ? { color: "var(--color-danger)", note: "⚠ 上限超過" }
      : totalCredits >= 40
      ? { color: "var(--color-success)", note: "" }
      : { color: "var(--color-warning)", note: "⚠ 40単位未満" };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 概要バー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
        <h3 className="font-semibold text-primary" style={{ flex: 1, fontSize: '1.125rem' }}>
          {currentYear}年次向けの履修提案
          <span className="text-tertiary" style={{ fontSize: '0.75rem', marginLeft: '1rem', fontWeight: 'normal' }}>※ 該当学年に配当されている未修得科目を優先しています</span>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span className="text-secondary">提案合計:</span>
          <span style={{ fontWeight: 'bold', color: creditStatus.color }}>{totalCredits} 単位</span>
          {creditStatus.note && (
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: creditStatus.color }}>
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
