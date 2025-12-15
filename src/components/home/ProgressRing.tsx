import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: "functional" | "padel" | "kine";
  label?: string;
  value?: string;
}

const colorClasses = {
  functional: "stroke-ring-functional",
  padel: "stroke-ring-padel",
  kine: "stroke-ring-kine",
};

export function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  className,
  color = "functional",
  label,
  value,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000 ease-out animate-progress", colorClasses[color])}
          style={{
            "--progress-offset": offset,
          } as React.CSSProperties}
        />
      </svg>
      {(label || value) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {value && <span className="text-lg font-bold font-display text-foreground">{value}</span>}
          {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  );
}
