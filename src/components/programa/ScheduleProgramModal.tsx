import { useState, useMemo } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProgramRoutine {
  id: string;
  routine_id: string;
  orden: number;
  routine: {
    id: string;
    nombre: string;
    portada_url: string | null;
    categoria: string;
  } | null;
}

interface ScheduleProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string;
  weekNumber: number;
  routines: ProgramRoutine[];
  onSchedule: (assignments: { routineId: string; date: Date }[]) => Promise<void>;
  isLoading?: boolean;
}

export function ScheduleProgramModal({
  open,
  onOpenChange,
  programName,
  weekNumber,
  routines,
  onSchedule,
  isLoading = false,
}: ScheduleProgramModalProps) {
  const today = startOfDay(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Track assignments: routineId -> Date
  const [assignments, setAssignments] = useState<Record<string, Date>>({});

  // Generate days for the current view (7 days starting from today + weekOffset)
  const days = useMemo(() => {
    const startDate = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [today, weekOffset]);

  const handleDayClick = (routineId: string, day: Date) => {
    // Don't allow past dates
    if (isBefore(day, today)) return;

    setAssignments((prev) => {
      // If already assigned to this day, remove it
      if (prev[routineId]?.getTime() === day.getTime()) {
        const { [routineId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [routineId]: day };
    });
  };

  const handleSubmit = async () => {
    const assignmentList = Object.entries(assignments).map(([routineId, date]) => ({
      routineId,
      date,
    }));
    await onSchedule(assignmentList);
  };

  const assignedCount = Object.keys(assignments).length;
  const canSubmit = assignedCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Agendar rutinas - Semana {weekNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Asigna cada rutina a un día del calendario. Las rutinas agendadas aparecerán en tu Home y Calendario.
          </p>

          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={weekOffset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {format(days[0], "d MMM", { locale: es })} - {format(days[6], "d MMM", { locale: es })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((day) => (
              <div key={day.toISOString()} className="text-xs">
                <span className="text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: es })}
                </span>
                <div
                  className={cn(
                    "mt-1 w-7 h-7 mx-auto rounded-full flex items-center justify-center text-sm font-medium",
                    day.getTime() === today.getTime()
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Routines list */}
          <div className="space-y-3">
            {routines
              .sort((a, b) => a.orden - b.orden)
              .map((routine) => {
                const assignedDate = assignments[routine.routine_id];
                
                return (
                  <div
                    key={routine.id}
                    className="bg-secondary/30 rounded-xl p-3 border border-border/30"
                  >
                    {/* Routine info */}
                    <div className="flex items-center gap-3 mb-3">
                      {routine.routine?.portada_url && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={routine.routine.portada_url}
                            alt={routine.routine.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {routine.routine?.nombre || "Rutina"}
                        </p>
                        {assignedDate && (
                          <p className="text-xs text-activity-training">
                            {format(assignedDate, "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Day selection grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day) => {
                        const isPast = isBefore(day, today);
                        const isSelected = assignedDate?.getTime() === day.getTime();
                        
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleDayClick(routine.routine_id, day)}
                            className={cn(
                              "h-8 rounded-lg text-xs font-medium transition-all",
                              isPast
                                ? "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                                : isSelected
                                ? "bg-activity-training text-white"
                                : "bg-muted/50 hover:bg-muted text-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Agendar {assignedCount} rutina{assignedCount !== 1 ? "s" : ""}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Puedes agendar algunas rutinas ahora y las demás después
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
