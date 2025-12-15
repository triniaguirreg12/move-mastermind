import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const Logo = ({ className, size = "md", showIcon = true }: LogoProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <svg
          className={cn(iconSizes[size], "text-primary")}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dumbbell icon */}
          <rect
            x="8"
            y="16"
            width="6"
            height="8"
            rx="1"
            fill="currentColor"
          />
          <rect
            x="26"
            y="16"
            width="6"
            height="8"
            rx="1"
            fill="currentColor"
          />
          <rect
            x="12"
            y="18"
            width="16"
            height="4"
            rx="1"
            fill="currentColor"
          />
          {/* Sparkle */}
          <path
            d="M32 8L34 12L38 10L36 14L40 16L36 18L38 22L34 20L32 24L30 20L26 22L28 18L24 16L28 14L26 10L30 12L32 8Z"
            fill="currentColor"
            className="opacity-80"
          />
        </svg>
      )}
      <span
        className={cn(
          "font-bold tracking-tight italic",
          sizeClasses[size],
          "text-foreground"
        )}
        style={{ fontStyle: "italic" }}
      >
        JUST MUV
      </span>
    </div>
  );
};
