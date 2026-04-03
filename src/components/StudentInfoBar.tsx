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
    <div className="bento-card flex" style={{ flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
      <div>
        <div className="text-xs text-tertiary mb-2">氏名</div>
        <div className="font-semibold text-primary">{student.studentName}</div>
      </div>
      <div style={{ height: '2rem', width: '1px', backgroundColor: 'var(--color-border)' }} />
      <div>
        <div className="text-xs text-tertiary mb-2">年次</div>
        <div className="font-semibold text-primary">{student.currentYear}年次</div>
      </div>
      <div style={{ height: '2rem', width: '1px', backgroundColor: 'var(--color-border)' }} />
      <div>
        <div className="text-xs text-tertiary mb-2">GPA</div>
        <div className="font-semibold text-primary">{student.gpa.toFixed(2)}</div>
      </div>
      <div style={{ height: '2rem', width: '1px', backgroundColor: 'var(--color-border)' }} />
      <div style={{ flex: 1, minWidth: '180px' }}>
        <div className="flex justify-between text-xs text-secondary mb-2">
          <span>取得単位数</span>
          <span className="font-medium text-primary">
            {student.earnedCredits} / {totalRequired} ({percent}%)
          </span>
        </div>
        <ProgressBar
          percent={percent}
          color="linear-gradient(to right, var(--color-brand), #c457f9)"
          size="md"
        />
      </div>
    </div>
  );
}
