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

const PRIORITY_COLORS: Record<SuggestedCourse["priority"], string> = {
  highest: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function CourseSuggestion({ suggestions }: CourseSuggestionProps) {
  const totalCredits = suggestions.reduce((sum, s) => sum + s.course.credits, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">サジェスト科目一覧</h3>
        <div className="text-sm">
          合計:{" "}
          <span
            className={`font-bold ${
              totalCredits >= 40
                ? totalCredits > 45
                  ? "text-red-600"
                  : "text-green-600"
                : "text-amber-600"
            }`}
          >
            {totalCredits} 単位
          </span>
          {totalCredits > 45 && (
            <span className="text-red-500 ml-2">⚠ 上限超過</span>
          )}
          {totalCredits < 40 && (
            <span className="text-amber-500 ml-2">⚠ 40単位未満</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-2">優先度</th>
              <th className="text-left p-2">科目番号</th>
              <th className="text-left p-2">科目名</th>
              <th className="text-center p-2">単位</th>
              <th className="text-left p-2">曜日時限</th>
              <th className="text-left p-2">モジュール</th>
              <th className="text-left p-2">理由</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.course.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      PRIORITY_COLORS[s.priority]
                    }`}
                  >
                    {PRIORITY_LABELS[s.priority]}
                  </span>
                </td>
                <td className="p-2 font-mono text-xs">{s.course.id}</td>
                <td className="p-2">{s.course.name}</td>
                <td className="p-2 text-center">{s.course.credits}</td>
                <td className="p-2">{s.course.dayPeriod}</td>
                <td className="p-2 text-xs">{s.course.modules.join(", ")}</td>
                <td className="p-2 text-xs text-gray-500">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
