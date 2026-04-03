import type { GradeRecord } from "@/types";

interface FailedCoursesAlertProps {
  failedCourses: GradeRecord[];
}

export default function FailedCoursesAlert({
  failedCourses,
}: FailedCoursesAlertProps) {
  if (failedCourses.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-red-500 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <h4 className="text-sm font-semibold text-red-700">
          不合格科目（D評価）— 再履修を検討してください
        </h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {failedCourses.map((f) => (
          <span
            key={f.courseId}
            className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-1"
          >
            <span className="font-mono">{f.courseId}</span>
            <span>{f.courseName}</span>
            <span className="text-red-400">({f.credits}単位)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
