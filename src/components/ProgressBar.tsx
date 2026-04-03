interface ProgressBarProps {
  percent: number;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  percent,
  color = "bg-blue-500",
  size = "md",
}: ProgressBarProps) {
  const h = SIZE_CLASS[size];
  return (
    <div className={`w-full bg-slate-200 rounded-full ${h} overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}
