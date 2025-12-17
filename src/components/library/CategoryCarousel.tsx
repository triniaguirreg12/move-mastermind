import { useRef } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LibraryCard } from "./LibraryCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Routine {
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
}

interface CategoryCarouselProps {
  title: string;
  description: string;
  routines: Routine[];
  categoryKey: "funcional" | "kinesiologia" | "activacion";
  onRoutineClick?: (id: string | number) => void;
}

const categoryTitleColors = {
  Funcional: "text-primary",
  Kinesiología: "text-[hsl(280,70%,60%)]",
  Activación: "text-warning",
};

export function CategoryCarousel({
  title,
  description,
  routines,
  categoryKey,
  onRoutineClick,
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleVerMas = () => {
    navigate(`/biblioteca/${categoryKey}`);
  };

  if (routines.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 className={cn(
            "font-display text-lg font-semibold",
            categoryTitleColors[title as keyof typeof categoryTitleColors] || "text-foreground"
          )}>
            {title}
          </h2>
          
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-secondary/50 rounded-full transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className="max-w-[200px] bg-card border-border text-foreground"
              >
                <p className="text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Ver más button + Navigation arrows (desktop) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerMas}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver más
          </button>
          
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {routines.map((routine) => (
          <div key={routine.id} className="snap-start">
            <LibraryCard
              {...routine}
              onClick={onRoutineClick ? () => onRoutineClick(routine.id) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
