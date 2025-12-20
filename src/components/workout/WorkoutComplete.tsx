import { useState } from "react";
import { Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StarRating } from "@/components/workout/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import trophyImage from "@/assets/workout-complete-trophy.png";

interface WorkoutCompleteProps {
  routineName: string;
  routineId: string;
  routineObjetivo?: Record<string, number> | null;
  /** If this routine was executed as part of a program */
  isPartOfProgram?: boolean;
  /** If completing this routine finishes the entire program */
  isProgramComplete?: boolean;
  /** Name of the program (if applicable) */
  programName?: string;
}

export function WorkoutComplete({
  routineName,
  routineId,
  isPartOfProgram = false,
  isProgramComplete = false,
  programName,
}: WorkoutCompleteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const { data: isFavorite = false } = useIsFavorite(routineId);
  const toggleFavorite = useToggleFavorite();

  // Show rating/favorites only for:
  // 1. Standalone routines (not part of program)
  // 2. Program completion (last routine of program)
  const showRatingAndFavorites = !isPartOfProgram || isProgramComplete;

  const handleRating = async (value: number) => {
    setRating(value);
    setHasRated(true);

    try {
      await supabase
        .from("routines")
        .update({ calificacion: value })
        .eq("id", routineId);

      toast.success("¡Gracias por tu evaluación!");
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({ routineId, isFavorite });
  };

  const handleGoHome = () => {
    // Invalidate queries to trigger recalculation on Home
    queryClient.invalidateQueries({ queryKey: ["weekly-completed-routines"] });
    queryClient.invalidateQueries({ queryKey: ["active-program"] });
    navigate("/");
  };

  // Determine completion text based on context
  const completionText = isProgramComplete
    ? "Completaste el programa"
    : "Completaste la rutina";

  const displayName = isProgramComplete && programName
    ? programName
    : routineName;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Trophy image */}
      <div className="mb-6 animate-scale-in">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
          <img
            src={trophyImage}
            alt="Trofeo de logro"
            className="w-24 h-24 object-contain relative z-10"
          />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
        ¡Felicitaciones!
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-muted-foreground mb-2 animate-fade-in">
        {completionText}
      </p>

      {/* Routine/Program name */}
      <p className="text-xl font-semibold text-primary mb-6 animate-fade-in">
        {displayName}
      </p>

      {/* Star Rating - only for standalone or program completion */}
      {showRatingAndFavorites && (
        <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-3">
            ¿Cómo calificarías esta {isProgramComplete ? "experiencia" : "rutina"}?
          </p>
          <div className="flex justify-center">
            <StarRating
              value={rating}
              onChange={handleRating}
              disabled={hasRated}
            />
          </div>
          {hasRated && (
            <p className="text-xs text-primary mt-2 animate-fade-in">
              ¡Gracias por tu evaluación!
            </p>
          )}
        </div>
      )}

      {/* Favorite Button - only for standalone or program completion */}
      {showRatingAndFavorites && (
        <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-3">
            ¿Te gustó esta {isProgramComplete ? "experiencia" : "rutina"}?
          </p>
          <button
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl transition-all",
              isFavorite
                ? "bg-destructive/10 border border-destructive/20 text-destructive"
                : "bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-all",
                isFavorite ? "fill-destructive" : ""
              )}
            />
            <span className="text-sm font-medium">
              {isFavorite ? "En favoritos" : "Agregar a favoritos"}
            </span>
          </button>
        </div>
      )}

      {/* Motivation message */}
      <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-8 animate-fade-in">
        <p className="text-sm text-muted-foreground">
          {isProgramComplete
            ? "¡Increíble! Has completado todo el programa. Tu dedicación es inspiradora."
            : "¡Sigue así! Cada entrenamiento te acerca a tus objetivos."}
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs animate-fade-in">
        <Button
          className="w-full h-12"
          onClick={handleGoHome}
        >
          <Home className="w-5 h-5 mr-2" />
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
