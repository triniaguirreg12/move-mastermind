import { cn } from "@/lib/utils";

interface JustMuvIconProps {
  className?: string;
  size?: number;
}

export function JustMuvIcon({ className, size = 80 }: JustMuvIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("animate-scale-in", className)}
    >
      {/* Glow filter */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Dumbbell - left side */}
      <g filter="url(#glow)">
        {/* Left weight */}
        <rect
          x="10"
          y="28"
          width="8"
          height="24"
          rx="2"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Right weight */}
        <rect
          x="34"
          y="28"
          width="8"
          height="24"
          rx="2"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Bar */}
        <rect
          x="16"
          y="37"
          width="20"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </g>
      
      {/* Padel ball - right side */}
      <g filter="url(#glow)">
        <circle
          cx="58"
          cy="40"
          r="14"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Ball seam - curved line */}
        <path
          d="M 48 32 Q 58 40 48 48"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 68 32 Q 58 40 68 48"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
