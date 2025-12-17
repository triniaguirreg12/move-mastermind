import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";

interface ScheduleRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineId: string;
  routineName: string;
  routineCategory?: string;
  routineCoverUrl?: string;
}

export function ScheduleRoutineModal({
  open,
  onOpenChange,
  routineId,
  routineName,
  routineCategory,
  routineCoverUrl,
}: ScheduleRoutineModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: schedules, isLoading } = useRoutineEventSchedules(routineId);
  const { mutate: scheduleRoutine, isPending } = useScheduleRoutineEvent();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    if (open) {
      checkAuth();
    }
  }, [open]);

  const handleSchedule = () => {
    // Check authentication first
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!selectedDate) return;

    scheduleRoutine(
      { routineId, routineName, routineCategory, routineCoverUrl, date: selectedDate },
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

  // Show auth prompt modal
  if (showAuthPrompt) {
    return (
      <AuthPromptModal
        isOpen={open}
        onClose={() => {
          setShowAuthPrompt(false);
          onOpenChange(false);
        }}
        title="Crea tu cuenta para programar rutinas"
        description="Regístrate o inicia sesión para guardar tus rutinas en el calendario y llevar el control de tu entrenamiento."
        accentColor="training"
      />
    );
  }

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
                classNames={{
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium capitalize text-foreground",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent border-0 p-0 opacity-70 hover:opacity-100 hover:bg-secondary"
                  ),
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal text-foreground hover:bg-secondary/80 rounded-full transition-colors",
                  day_selected: "!bg-activity-training !text-background hover:!bg-activity-training/90 rounded-full",
                  day_today: "ring-2 ring-foreground ring-inset !bg-transparent rounded-full",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
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
