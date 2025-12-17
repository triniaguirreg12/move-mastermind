import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSchedulePadel, PadelSubtype } from "@/hooks/useUserEvents";
import { useToast } from "@/hooks/use-toast";

interface AgendarPadelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

const subtypeOptions: { value: PadelSubtype; label: string }[] = [
  { value: "partido", label: "Partido" },
  { value: "clase", label: "Clase" },
  { value: "torneo", label: "Torneo" },
];

export function AgendarPadelModal({
  isOpen,
  onClose,
  initialDate,
}: AgendarPadelModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate || new Date());
  const [selectedSubtype, setSelectedSubtype] = useState<PadelSubtype>("partido");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  const schedulePadel = useSchedulePadel();
  const { toast } = useToast();

  const validateForm = (): string | null => {
    if (!selectedDate) {
      return "Debes seleccionar una fecha";
    }
    if (!selectedSubtype) {
      return "Debes seleccionar un tipo de actividad";
    }
    if (timeStart && timeEnd && timeEnd <= timeStart) {
      return "La hora de fin debe ser mayor a la hora de inicio";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) return;

    try {
      await schedulePadel.mutateAsync({
        date: selectedDate,
        timeStart: timeStart || undefined,
        timeEnd: timeEnd || undefined,
        subtype: selectedSubtype,
      });

      onClose();
      // Reset form
      setSelectedDate(new Date());
      setSelectedSubtype("partido");
      setTimeStart("");
      setTimeEnd("");
    } catch (error: any) {
      // Error is already handled in the hook, but we can add specific logging
      console.error("Padel scheduling failed:", {
        date: selectedDate?.toISOString(),
        subtype: selectedSubtype,
        timeStart,
        timeEnd,
        error: error?.message,
      });
    }
  };

  const isPastDate = selectedDate && selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-activity-padel" />
            Agendar Pádel
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Programa una actividad de pádel en tu calendario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subtype Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Tipo de actividad</Label>
            <div className="flex gap-2">
              {subtypeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedSubtype === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSubtype(option.value)}
                  className={cn(
                    selectedSubtype === option.value &&
                      "bg-activity-padel text-background hover:bg-activity-padel/90"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Fecha</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md border border-border bg-secondary/30"
                classNames={{
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium capitalize text-foreground",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent border-0 p-0 opacity-70 hover:opacity-100 hover:bg-secondary"
                  ),
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  day: "h-9 w-9 p-0 font-normal text-foreground hover:bg-secondary rounded-md",
                  day_selected: "bg-activity-padel text-background hover:bg-activity-padel hover:text-background",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                }}
              />
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora inicio
              </Label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-activity-padel focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora fin
              </Label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-activity-padel focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Info about past dates */}
          {isPastDate && (
            <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
              Al agendar en una fecha pasada, se marcará automáticamente como completado.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || schedulePadel.isPending}
            className="flex-1 bg-activity-padel text-background hover:bg-activity-padel/90"
          >
            {schedulePadel.isPending ? "Agendando..." : "Agendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
