import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRoutineEventSchedules, useScheduleRoutineEvent } from "@/hooks/useUserEvents";

interface ScheduleRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineId: string;
  routineName: string;
}

export function ScheduleRoutineModal({
  open,
  onOpenChange,
  routineId,
  routineName,
}: ScheduleRoutineModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { data: schedules, isLoading } = useRoutineEventSchedules(routineId);
  const { mutate: scheduleRoutine, isPending } = useScheduleRoutineEvent();

  const handleSchedule = () => {
    if (!selectedDate) return;

    scheduleRoutine(
      { routineId, routineName, date: selectedDate },
      {
        onSuccess: () => {
          setSelectedDate(undefined);
          onOpenChange(false);
        },
      }
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Programar rutina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Routine name */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm font-medium text-foreground">{routineName}</p>
          </div>

          {/* Existing schedules */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Historial de programaciones
            </h3>

            {isLoading ? (
              <div className="p-4 text-center">
                <span className="text-sm text-muted-foreground">Cargando...</span>
              </div>
            ) : schedules?.past.length === 0 && schedules?.future.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border/50 text-center">
                <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aún no has programado esta rutina
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Future schedules (highlighted) */}
                {schedules?.future.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(event.event_date), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                      Próxima
                    </span>
                  </div>
                ))}

                {/* Past schedules */}
                {schedules?.past.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <div className="flex items-center gap-2">
                      {event.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      event.status === "completed" 
                        ? "bg-green-500/20 text-green-500"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {event.status === "completed" ? "Completada" : "Pasada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Selecciona una fecha
            </h3>

            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < today}
                locale={es}
                className="rounded-lg border border-border p-3 pointer-events-auto"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSchedule}
              disabled={!selectedDate || isPending}
            >
              {isPending ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
