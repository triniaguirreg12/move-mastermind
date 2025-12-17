import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSchedulePadel, PadelSubtype } from "@/hooks/useUserEvents";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";

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

const timeOptions = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30",
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
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const schedulePadel = useSchedulePadel();
  const { toast } = useToast();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [isOpen]);

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
    // Check authentication first
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auth prompt modal
  if (showAuthPrompt) {
    return (
      <AuthPromptModal
        isOpen={isOpen}
        onClose={() => {
          setShowAuthPrompt(false);
          onClose();
        }}
        title="Crea tu cuenta para agendar"
        description="Regístrate o inicia sesión para guardar tus actividades de pádel y ver tu progreso en el calendario."
        accentColor="padel"
      />
    );
  }

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
                  row: "flex w-full mt-2",
                  // Override cell to remove any accent/green background
                  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal text-foreground hover:bg-secondary/80 rounded-md transition-colors",
                  day_selected: "!bg-activity-padel !text-background hover:!bg-activity-padel/90",
                  day_today: "ring-2 ring-white/70 ring-inset !bg-transparent",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "bg-activity-padel/20",
                }}
              />
            </div>
          </div>

          {/* Time Selection with 30-min increments */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora inicio
              </Label>
              <Select value={timeStart} onValueChange={setTimeStart}>
                <SelectTrigger className="w-full bg-secondary border-border text-foreground focus:ring-activity-padel">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-48">
                  {timeOptions.map((time) => (
                    <SelectItem 
                      key={time} 
                      value={time} 
                      className="text-foreground focus:bg-activity-padel/20 focus:text-foreground data-[state=checked]:bg-activity-padel/30"
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hora fin
              </Label>
              <Select value={timeEnd} onValueChange={setTimeEnd}>
                <SelectTrigger className="w-full bg-secondary border-border text-foreground focus:ring-activity-padel">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-48">
                  {timeOptions.map((time) => (
                    <SelectItem 
                      key={time} 
                      value={time} 
                      className="text-foreground focus:bg-activity-padel/20 focus:text-foreground data-[state=checked]:bg-activity-padel/30"
                      disabled={timeStart ? time <= timeStart : false}
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
