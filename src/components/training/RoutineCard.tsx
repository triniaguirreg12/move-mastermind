import { Clock, Dumbbell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutineCardProps {
  title: string;
  description: string;
  duration: string;
  level: string;
  equipment: string[];
  imageUrl?: string;
  category?: "funcional" | "activacion" | "kine" | "padel";
  onClick?: () => void;
}

const categoryColors = {
  funcional: "from-primary to-primary/50",
  activacion: "from-warning to-warning/50",
  kine: "from-accent to-accent/50",
  padel: "from-success to-success/50",
};

const categoryBadgeColors = {
  funcional: "bg-primary/20 text-primary",
  activacion: "bg-warning/20 text-warning",
  kine: "bg-accent/20 text-accent",
  padel: "bg-success/20 text-success",
};

export function RoutineCard({
  title,
  description,
  duration,
  level,
  equipment,
  imageUrl,
  category = "funcional",
  onClick,
}: RoutineCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-accent/50 transition-all duration-300 group"
    >
      {/* Image header */}
      <div className={cn(
        "relative h-32 bg-gradient-to-br",
        categoryColors[category]
      )}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium capitalize",
            categoryBadgeColors[category]
          )}>
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-accent group-hover:translate-x-1 transition-all mt-1" />
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>{level}</span>
          </div>
        </div>

        {equipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {equipment.slice(0, 3).map((item) => (
              <span
                key={item}
                className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-secondary-foreground"
              >
                {item}
              </span>
            ))}
            {equipment.length > 3 && (
              <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] text-secondary-foreground">
                +{equipment.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
