import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Check, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ActiveProgram, ActiveProgramRoutine } from "@/hooks/useActiveProgram";

interface ActiveProgramSectionProps {
  program: ActiveProgram;
}

export function ActiveProgramSection({ program }: ActiveProgramSectionProps) {
  const navigate = useNavigate();

  // Get current week data
  const currentWeekData = program.weeks.find(w => w.week_number === program.currentWeek);
  const routines = currentWeekData?.routines || [];
  const isWeekComplete = currentWeekData?.isCompleted || false;

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
        fromProgram: true,
        programId: program.id,
        customData: routine.custom_data,
      },
    });
  };

  return (
    <div className="px-4 py-2">
      <div className="bg-card rounded-2xl p-4 border border-border overflow-hidden relative">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Tu programa activo
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground line-clamp-1">
              {program.nombre}
            </h3>
          </div>
        </div>

        {/* Week progress */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Semana {program.currentWeek} de {program.totalWeeks}
            </span>
            <span className="text-xs text-muted-foreground">
              {program.completedWeeks} / {program.totalWeeks} completadas
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current week routines */}
        <div className="space-y-2 mb-4 relative z-10">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Rutinas de esta semana
          </h4>
          {routines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay rutinas asignadas para esta semana
            </p>
          ) : (
            <div className="space-y-2">
              {routines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => handleRoutineClick(routine)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    routine.isCompleted
                      ? "bg-activity-training/10 border border-activity-training/20"
                      : "bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border"
                  )}
                >
                  {/* Status icon */}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    routine.isCompleted
                      ? "bg-activity-training text-background"
                      : "border-2 border-muted-foreground/30"
                  )}>
                    {routine.isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Routine info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      routine.isCompleted ? "text-foreground/70" : "text-foreground"
                    )}>
                      {routine.routine?.nombre || "Rutina"}
                    </p>
                    {routine.routine?.categoria && (
                      <p className="text-xs text-muted-foreground">
                        {routine.routine.categoria}
                      </p>
                    )}
                  </div>

                  <ChevronRight className={cn(
                    "h-4 w-4 flex-shrink-0",
                    routine.isCompleted ? "text-muted-foreground/50" : "text-muted-foreground"
                  )} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="relative z-10">
          {isWeekComplete ? (
            <div className="bg-activity-training/10 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-activity-training flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                ¡Semana completada!
              </p>
              {program.currentWeek < program.totalWeeks && (
                <p className="text-xs text-muted-foreground mt-1">
                  La próxima semana comenzará pronto
                </p>
              )}
            </div>
          ) : nextPendingRoutine ? (
            <Button 
              onClick={handleContinue}
              className="w-full"
              size="lg"
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
  return (
    <div className="px-4 py-2">
      <div className="bg-card/50 rounded-xl p-4 border border-dashed border-border/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-foreground mb-1">
              ¿Quieres un plan estructurado?
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Solicita un programa personalizado diseñado para tus objetivos
            </p>
            <Link to="/profesionales">
              <Button variant="outline" size="sm">
                Solicitar programa
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
