interface ProgressBarProps {
  percent: number;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "6px",
  md: "10px",
  lg: "16px",
};

export default function ProgressBar({
  percent,
  color = "var(--color-brand)",
  size = "md",
}: ProgressBarProps) {
  const h = SIZE_MAP[size];
  return (
    <div style={{ width: '100%', background: 'var(--color-border)', borderRadius: '9999px', height: h, overflow: 'hidden' }}>
      <div
        style={{ height: '100%', borderRadius: '9999px', transition: 'width 0.5s ease', background: color, width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}
