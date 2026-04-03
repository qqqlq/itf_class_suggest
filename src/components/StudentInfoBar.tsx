import type { StudentData } from "@/types";
import ProgressBar from "./ProgressBar";

interface StudentInfoBarProps {
  student: StudentData;
  totalRequired: number;
}

export default function StudentInfoBar({
  student,
  totalRequired,
}: StudentInfoBarProps) {
  const percent = Math.min(
    100,
    Math.round((student.earnedCredits / totalRequired) * 100)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <div className="text-xs text-slate-400 mb-0.5">氏名</div>
          <div className="font-semibold text-slate-900 text-sm">{student.studentName}</div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 mb-0.5">年次</div>
          <div className="font-semibold text-slate-900 text-sm">{student.currentYear}年次</div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
        <div>
          <div className="text-xs text-slate-400 mb-0.5">GPA</div>
          <div className="font-semibold text-slate-900 text-sm">{student.gpa.toFixed(2)}</div>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
        <div className="flex-1 min-w-[180px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>取得単位数</span>
            <span className="font-medium text-slate-600">
              {student.earnedCredits} / {totalRequired} ({percent}%)
            </span>
          </div>
          <ProgressBar
            percent={percent}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
