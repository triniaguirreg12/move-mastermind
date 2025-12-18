import { useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { JustMuvIcon } from "@/components/brand/JustMuvIcon";
import { StarRating } from "@/components/workout/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface WorkoutCompleteProps {
  routineName: string;
  routineId: string;
  routineObjetivo?: Record<string, number> | null;
}

export function WorkoutComplete({
  routineName,
  routineId,
  routineObjetivo,
}: WorkoutCompleteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRating = async (value: number) => {
    setRating(value);
    setHasRated(true);

    try {
      // Save rating to routine (average calculation could be done later)
      await supabase
        .from("routines")
        .update({ calificacion: value })
        .eq("id", routineId);

      toast.success("¡Gracias por tu evaluación!");
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  const handleGoHome = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // Update user aptitudes based on routine objetivo
      if (user && routineObjetivo) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("aptitudes")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          const currentAptitudes = (profile.aptitudes as Record<string, number>) || {
            fuerza: 0,
            potencia: 0,
            agilidad: 0,
            coordinacion: 0,
            estabilidad: 0,
            velocidad: 0,
            resistencia: 0,
            movilidad: 0,
          };

          // Add routine's objetivo to user's aptitudes (small increment per workout)
          const updatedAptitudes: Record<string, number> = {};
          
          Object.keys(currentAptitudes).forEach((key) => {
            const routineValue = routineObjetivo[key] || 0;
            const currentValue = currentAptitudes[key] || 0;
            // Each workout adds a fraction of the routine's objective (capped at 100)
            const increment = routineValue * 0.1; // 10% of routine objective per workout
            updatedAptitudes[key] = Math.min(100, Math.round((currentValue + increment) * 10) / 10);
          });

          await supabase
            .from("profiles")
            .update({ aptitudes: updatedAptitudes })
            .eq("user_id", user.id);
        }
      }
    } catch (error) {
      console.error("Error updating aptitudes:", error);
    }

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
          disabled={isUpdating}
        >
          <Home className="w-5 h-5 mr-2" />
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
