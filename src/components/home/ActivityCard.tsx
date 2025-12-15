import { ChevronRight, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  title: string;
  subtitle: string;
  duration?: string;
  level?: string;
  imageUrl?: string;
  color?: "primary" | "accent" | "success";
  onClick?: () => void;
}

const colorClasses = {
  primary: "border-l-primary",
  accent: "border-l-accent",
  success: "border-l-success",
};

export function ActivityCard({
  title,
  subtitle,
  duration,
  level,
  imageUrl,
  color = "primary",
  onClick,
}: ActivityCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl bg-card/50 hover:bg-card transition-all duration-200 border-l-4 group",
        colorClasses[color]
      )}
    >
      {imageUrl && (
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 text-left">
        <h4 className="font-medium text-foreground line-clamp-1">{title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
        
        {(duration || level) && (
          <div className="flex items-center gap-3 mt-1.5">
            {duration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{duration}</span>
              </div>
            )}
            {level && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                <span>{level}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
    </button>
  );
}
