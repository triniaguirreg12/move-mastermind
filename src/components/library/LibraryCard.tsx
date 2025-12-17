import { Clock, Calendar, Dumbbell, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LibraryCardProps {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  rating?: number;
  difficulty: "Principiante" | "Intermedio" | "Avanzado";
  duration: string;
  equipment: string[];
  aptitudes: { name: string; value: number }[];
  category: "funcional" | "kinesiologia" | "activacion";
  tipo?: "rutina" | "programa";
  onClick?: () => void;
}

const categoryGradients = {
  funcional: "from-primary/80 to-primary/20",
  kinesiologia: "from-[hsl(280,70%,60%)]/80 to-[hsl(280,70%,60%)]/20",
  activacion: "from-warning/80 to-warning/20",
};

// Padel ball SVG component
function PadelBall({ filled }: { filled: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      className={cn(
        "transition-colors",
        filled ? "text-primary" : "text-muted-foreground/40"
      )}
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill={filled ? "currentColor" : "transparent"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Tennis/padel ball curve lines */}
      <path
        d="M4 3.5C6 5.5 6 10.5 4 12.5"
        stroke={filled ? "hsl(var(--primary-foreground))" : "currentColor"}
        strokeWidth="1"
        fill="none"
        opacity={filled ? 0.6 : 0.5}
      />
      <path
        d="M12 3.5C10 5.5 10 10.5 12 12.5"
        stroke={filled ? "hsl(var(--primary-foreground))" : "currentColor"}
        strokeWidth="1"
        fill="none"
        opacity={filled ? 0.6 : 0.5}
      />
    </svg>
  );
}

// Difficulty as padel balls
function DifficultyIndicator({ level }: { level: string }) {
  const filled = level === "Principiante" ? 1 : level === "Intermedio" ? 2 : 3;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <PadelBall key={i} filled={i <= filled} />
      ))}
    </div>
  );
}

// Simplified aptitude preview bars - smaller and more subtle
function AptitudePreview({ aptitudes }: { aptitudes: { name: string; value: number }[] }) {
  // Get top 2-3 aptitudes by value
  const topAptitudes = [...aptitudes]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .filter(a => a.value > 0);

  if (topAptitudes.length === 0) return null;

  const maxValue = Math.max(...topAptitudes.map(a => a.value));

  return (
    <div className="space-y-0.5">
      {topAptitudes.map((apt) => (
        <div key={apt.name} className="flex items-center gap-1">
          <span className="text-[8px] text-white/60 w-12 truncate">{apt.name}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/50 rounded-full transition-all"
              style={{ width: `${(apt.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryCard({
  id,
  title,
  subtitle,
  imageUrl,
  rating,
  difficulty,
  duration,
  equipment,
  aptitudes,
  category,
  tipo = "rutina",
  onClick,
}: LibraryCardProps) {
  const navigate = useNavigate();
  // Equipment logic: filter out "Sin implemento" if real implements exist, sort alphabetically
  const realEquipment = equipment
    .filter(e => e !== "Sin implemento")
    .sort(); // Alphabetical order for consistency
  const hasRealEquipment = realEquipment.length > 0;
  const displayEquipment = hasRealEquipment ? realEquipment : ["Sin implemento"];
  const extraEquipmentCount = hasRealEquipment ? realEquipment.length - 1 : 0;
  const isPrograma = tipo === "programa";

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/rutina/${id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 w-36 group focus:outline-none"
    >
      {/* Card Image Container */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]">
        {/* Background Image or Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          categoryGradients[category]
        )}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        {/* Top Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Top Overlay: Difficulty + Rating */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {/* Difficulty - Higher priority */}
          <div className="bg-black/40 backdrop-blur-sm px-1.5 py-1 rounded-md">
            <DifficultyIndicator level={difficulty} />
          </div>

          {/* Rating */}
          {rating !== undefined && rating > 0 ? (
            <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <span className="text-[10px] font-semibold text-white">{rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 text-warning fill-warning" />
            </div>
          ) : (
            <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <span className="text-[10px] text-white/60">—</span>
            </div>
          )}
        </div>

        {/* Bottom Overlay: Aptitudes, Duration, Equipment */}
        <div className="absolute bottom-2 left-2 right-2 space-y-1.5">
          {/* Aptitude Preview - Smaller and subtle */}
          <AptitudePreview aptitudes={aptitudes} />

          {/* Duration & Equipment Row */}
          <div className="flex items-center justify-between gap-1">
            {/* Duration - Only show if there's a value */}
            {duration && (
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md shrink-0">
                {isPrograma ? (
                  <Calendar className="w-2.5 h-2.5 text-white/80 shrink-0" />
                ) : (
                  <Clock className="w-2.5 h-2.5 text-white/80 shrink-0" />
                )}
                <span className="text-[9px] font-medium text-white whitespace-nowrap">{duration}</span>
              </div>
            )}

            {/* Equipment - First implement + "+N" if more */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                <Dumbbell className="w-2.5 h-2.5 text-white/80 shrink-0" />
                <span className="text-[8px] text-white whitespace-nowrap">
                  {displayEquipment[0]}
                </span>
              </div>
              {extraEquipmentCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-black/40 backdrop-blur-sm px-1 py-0.5 rounded-md cursor-pointer">
                        <span className="text-[8px] text-white/80 font-medium">
                          +{extraEquipmentCount}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card border-border">
                      <p className="text-xs">{realEquipment.slice(1).join(", ")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text below card */}
      <div className="mt-2 text-left px-0.5">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
