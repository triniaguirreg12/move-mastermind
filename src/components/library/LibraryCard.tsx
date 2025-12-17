import { Clock, Dumbbell, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onClick?: () => void;
}

const categoryGradients = {
  funcional: "from-primary/80 to-primary/20",
  kinesiologia: "from-[hsl(280,70%,60%)]/80 to-[hsl(280,70%,60%)]/20",
  activacion: "from-warning/80 to-warning/20",
};

// Difficulty as padel balls
function DifficultyIndicator({ level }: { level: string }) {
  const filled = level === "Principiante" ? 1 : level === "Intermedio" ? 2 : 3;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "w-2.5 h-2.5 rounded-full border border-white/50",
            i <= filled ? "bg-white" : "bg-transparent"
          )}
        />
      ))}
    </div>
  );
}

// Simple aptitude preview bars
function AptitudePreview({ aptitudes }: { aptitudes: { name: string; value: number }[] }) {
  // Get top 3 aptitudes by value
  const topAptitudes = [...aptitudes]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .filter(a => a.value > 0);

  if (topAptitudes.length === 0) return null;

  const maxValue = Math.max(...topAptitudes.map(a => a.value));

  return (
    <div className="space-y-1">
      {topAptitudes.map((apt) => (
        <div key={apt.name} className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/80 w-14 truncate">{apt.name}</span>
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${(apt.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryCard({
  title,
  subtitle,
  imageUrl,
  rating,
  difficulty,
  duration,
  equipment,
  aptitudes,
  category,
  onClick,
}: LibraryCardProps) {
  const hasEquipment = equipment.length > 0 && !equipment.includes("Sin implemento");
  const displayEquipment = hasEquipment 
    ? equipment.filter(e => e !== "Sin implemento").slice(0, 2)
    : ["Sin implemento"];

  return (
    <button
      onClick={onClick}
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

        {/* Top Overlay: Rating + Difficulty */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
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

          {/* Difficulty */}
          <div className="bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            <DifficultyIndicator level={difficulty} />
          </div>
        </div>

        {/* Bottom Overlay: Duration, Equipment, Aptitudes */}
        <div className="absolute bottom-2 left-2 right-2 space-y-2">
          {/* Aptitude Preview */}
          <AptitudePreview aptitudes={aptitudes} />

          {/* Duration & Equipment Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <Clock className="w-2.5 h-2.5 text-white/80" />
              <span className="text-[9px] font-medium text-white">{duration}</span>
            </div>

            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <Dumbbell className="w-2.5 h-2.5 text-white/80" />
              <span className="text-[9px] text-white truncate max-w-[50px]">
                {displayEquipment.length === 1 
                  ? displayEquipment[0] 
                  : `${displayEquipment.length}+`}
              </span>
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