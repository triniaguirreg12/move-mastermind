import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Check, Circle, Sparkles, Star, Heart, Trophy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ActiveProgram, ActiveProgramRoutine } from "@/hooks/useActiveProgram";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { useCompleteProgram } from "@/hooks/useUserPrograms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActiveProgramSectionProps {
  program: ActiveProgram;
}

export function ActiveProgramSection({ program }: ActiveProgramSectionProps) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const { data: isFavorite = false } = useIsFavorite(program.id);
  const toggleFavorite = useToggleFavorite();
  const completeProgram = useCompleteProgram();

  // Get current week data
  const currentWeekData = program.weeks.find(w => w.week_number === program.currentWeek);
  const routines = currentWeekData?.routines || [];
  const isWeekComplete = currentWeekData?.isCompleted || false;

  // Check if program is complete
  const isProgramComplete = program.completedWeeks >= program.totalWeeks && program.totalWeeks > 0;

  // Find next pending routine
  const nextPendingRoutine = routines.find(r => !r.isCompleted);

  // Calculate progress percentage
  const progressPercent = program.totalWeeks > 0 
    ? Math.round((program.completedWeeks / program.totalWeeks) * 100)
    : 0;

  const handleContinue = () => {
    if (nextPendingRoutine) {
      // Navigate to routine detail with program context
      navigate(`/rutina/${nextPendingRoutine.routine_id}`, {
        state: {
          from: "/",
          fromProgram: true,
          programId: program.id,
          customData: nextPendingRoutine.custom_data,
        },
      });
    }
  };

  const handleRoutineClick = (routine: ActiveProgramRoutine) => {
    navigate(`/rutina/${routine.routine_id}`, {
      state: {
        from: "/",
        fromProgram: true,
        programId: program.id,
        customData: routine.custom_data,
      },
    });
  };

  const handleRating = async (value: number) => {
    setRating(value);
    setHasRated(true);

    try {
      await supabase
        .from("routines")
        .update({ calificacion: value })
        .eq("id", program.id);
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({ routineId: program.id, isFavorite });
  };

  const handleSubmitFeedback = () => {
    completeProgram.mutate(program.id, {
      onSuccess: () => {
        toast.success("¡Gracias por tu feedback! Programa finalizado.");
      },
    });
  };

  // Completed program view
  if (isProgramComplete) {
    return (
      <div className="px-4 py-2">
        <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl p-4 border border-primary/20 overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-primary/5 rounded-full pointer-events-none" />
          
          {/* Header with trophy */}
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-primary uppercase tracking-wide">
                ¡Programa completado!
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {program.nombre}
              </h3>
            </div>
          </div>

          {/* Congratulations message */}
          <div className="bg-card/50 rounded-xl p-3 mb-4 relative z-10">
            <p className="text-sm text-foreground text-center">
              ¡Felicitaciones! Has completado todas las semanas del programa.
            </p>
          </div>

          {/* Rating section */}
          <div className="bg-card/50 rounded-xl p-3 mb-3 relative z-10">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              ¿Cómo calificarías este programa?
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !hasRated && handleRating(star)}
                  disabled={hasRated}
                  className="p-1 transition-transform hover:scale-110 disabled:opacity-70"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      star <= rating
                        ? "text-warning fill-warning"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
            {hasRated && (
              <p className="text-[10px] text-primary mt-2 text-center">
                ¡Gracias por tu evaluación!
              </p>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all relative z-10 mb-3",
              isFavorite
                ? "bg-destructive/10 border border-destructive/20 text-destructive"
                : "bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isFavorite ? "fill-destructive" : ""
              )}
            />
            <span className="text-sm font-medium">
              {isFavorite ? "En favoritos" : "Agregar a favoritos"}
            </span>
          </button>

          {/* Submit feedback button */}
          <Button
            onClick={handleSubmitFeedback}
            disabled={completeProgram.isPending}
            className="w-full relative z-10"
          >
            <Send className="h-4 w-4 mr-2" />
            {completeProgram.isPending ? "Enviando..." : "Enviar y finalizar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="bg-card rounded-2xl p-3 border border-border overflow-hidden relative">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-2 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                Tu programa activo
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground line-clamp-1">
              {program.nombre}
            </h3>
          </div>
        </div>

        {/* Week progress */}
        <div className="mb-2 relative z-10">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              Semana {program.currentWeek} de {program.totalWeeks}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {program.completedWeeks} / {program.totalWeeks} completadas
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Current week routines - compact list */}
        <div className="space-y-1.5 mb-2 relative z-10">
          {routines.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay rutinas asignadas para esta semana
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {routines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => handleRoutineClick(routine)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all",
                    routine.isCompleted
                      ? "bg-activity-training/10 text-activity-training border border-activity-training/20"
                      : "bg-secondary/50 text-foreground hover:bg-secondary border border-transparent"
                  )}
                >
                  {routine.isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                  <span className="truncate max-w-[120px]">
                    {routine.routine?.nombre || "Rutina"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="relative z-10">
          {isWeekComplete ? (
            <div className="bg-activity-training/10 rounded-lg py-2 px-3 text-center">
              <p className="text-xs font-medium text-activity-training flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                ¡Semana completada!
              </p>
            </div>
          ) : nextPendingRoutine ? (
            <Button 
              onClick={handleContinue}
              className="w-full"
              size="sm"
            >
              Continuar programa
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NoProgramCTA() {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate("/biblioteca/funcional?tipo=programa");
  };

  return (
    <div className="mt-6 bg-card/50 rounded-xl p-4 border border-dashed border-border/50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground mb-1">
            ¿Quieres un plan estructurado?
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Explora programas disponibles o solicita uno personalizado
          </p>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={handleExplore}>
              Explorar programas
            </Button>
            <Link to="/profesionales">
              <Button variant="outline" size="sm">
                Solicitar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}