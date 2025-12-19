import { useState } from "react";
import { Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { JustMuvIcon } from "@/components/brand/JustMuvIcon";
import { StarRating } from "@/components/workout/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface WorkoutCompleteProps {
  routineName: string;
  routineId: string;
  routineObjetivo?: Record<string, number> | null;
}

export function WorkoutComplete({
  routineName,
  routineId,
}: WorkoutCompleteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const { data: isFavorite = false } = useIsFavorite(routineId);
  const toggleFavorite = useToggleFavorite();

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
    // Invalidate weekly aptitudes query to trigger recalculation on Home
    queryClient.invalidateQueries({ queryKey: ["weekly-completed-routines"] });
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Success icon - Just Muv branded */}
      <div className="mb-6 animate-scale-in">
        <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <JustMuvIcon size={64} className="text-primary" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
        ¡Felicitaciones!
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-muted-foreground mb-2 animate-fade-in">
        Completaste la rutina
      </p>

      {/* Routine name */}
      <p className="text-xl font-semibold text-primary mb-6 animate-fade-in">
        {routineName}
      </p>

      {/* Star Rating */}
      <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-4 animate-fade-in">
        <p className="text-sm text-muted-foreground mb-3">
          ¿Cómo calificarías esta rutina?
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

      {/* Favorite Button */}
      <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-4 animate-fade-in">
        <p className="text-sm text-muted-foreground mb-3">
          ¿Te gustó esta rutina?
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

      {/* Motivation message */}
      <div className="w-full max-w-xs bg-card/50 rounded-2xl p-4 border border-border/30 mb-8 animate-fade-in">
        <p className="text-sm text-muted-foreground">
          ¡Sigue así! Cada entrenamiento te acerca a tus objetivos.
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