import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActiveProgram } from "@/hooks/useActiveProgram";

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
          from: "/",
          fromProgram: true,
          programId: program.id,
          customData: nextPendingRoutine.custom_data,
        },
      });
    }
  };

  return (
    <div className="py-2">
      <div className="bg-card rounded-2xl p-4 border border-primary/20 overflow-hidden relative">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Programa activo
              </span>
            </div>
            <button
              onClick={() => navigate(`/programa/${program.id}`)}
              className="text-lg font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors text-left"
            >
              {program.nombre}
            </button>
          </div>
        </div>

        {/* Week progress */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-foreground font-medium">
              Semana {program.currentWeek} de {program.totalWeeks}
            </span>
            <span className="text-muted-foreground">
              {program.completedWeeks} completadas
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Next routine to do - now a clickable button */}
        {nextPendingRoutine && !isWeekComplete ? (
          <button
            onClick={handleContinue}
            className="w-full bg-primary/10 border border-primary/30 rounded-xl p-3 relative z-10 hover:bg-primary/20 transition-colors text-left group"
          >
            <p className="text-[10px] font-medium text-primary uppercase tracking-wide mb-1">
              Siguiente rutina
            </p>
            <div className="flex items-center gap-3">
              {nextPendingRoutine.routine?.portada_url && (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={nextPendingRoutine.routine.portada_url}
                    alt={nextPendingRoutine.routine.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                  {nextPendingRoutine.routine?.nombre || "Rutina"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Rutina {routines.findIndex(r => r.id === nextPendingRoutine.id) + 1} de {routines.length} esta semana
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ChevronRight className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </button>
        ) : isWeekComplete ? (
          <div className="bg-activity-training/10 rounded-xl py-3 px-4 text-center relative z-10">
            <p className="text-sm font-medium text-activity-training flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              ¡Semana completada!
            </p>
          </div>
        ) : null}
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