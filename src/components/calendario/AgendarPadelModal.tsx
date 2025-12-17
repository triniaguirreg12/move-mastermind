import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSchedulePadel, PadelSubtype } from "@/hooks/useUserEvents";

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

  const handleSubmit = async () => {
    if (!selectedDate) return;

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-activity-padel" />
            Agendar Pádel
          </DialogTitle>
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border border-border"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora inicio
              </Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora fin
              </Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Info about past dates */}
          {selectedDate && selectedDate < new Date(new Date().setHours(0, 0, 0, 0)) && (
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
