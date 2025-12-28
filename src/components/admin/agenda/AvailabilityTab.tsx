import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Globe,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Save,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  useAvailabilitySettings,
  useWeeklyAvailability,
  useAvailabilityExceptions,
  useSaveAvailabilitySettings,
  useSaveWeeklyAvailability,
  useAddException,
  useDeleteException,
  type WeeklyRange,
  type AvailabilityException,
} from "@/hooks/useAvailability";

interface AvailabilityTabProps {
  professionalId: string;
}

interface DaySchedule {
  dayOfWeek: number;
  isActive: boolean;
  ranges: Array<{ start: string; end: string }>;
}

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "60 minutos" },
  { value: 90, label: "90 minutos" },
];

const BUFFER_OPTIONS = [
  { value: 0, label: "Sin buffer" },
  { value: 10, label: "10 minutos" },
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
];

export const AvailabilityTab = ({ professionalId }: AvailabilityTabProps) => {
  const { data: settings, isLoading: loadingSettings } = useAvailabilitySettings(professionalId);
  const { data: weeklyRanges = [], isLoading: loadingRanges } = useWeeklyAvailability(professionalId);
  const { data: exceptions = [], isLoading: loadingExceptions } = useAvailabilityExceptions(professionalId);

  const saveSettings = useSaveAvailabilitySettings();
  const saveWeekly = useSaveWeeklyAvailability();
  const addException = useAddException();
  const deleteException = useDeleteException();

  const [meetingDuration, setMeetingDuration] = useState(60);
  const [buffer, setBuffer] = useState(0);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Exception dialog state
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [exceptionDate, setExceptionDate] = useState<Date | undefined>();
  const [exceptionAllDay, setExceptionAllDay] = useState(true);
  const [exceptionStart, setExceptionStart] = useState("09:00");
  const [exceptionEnd, setExceptionEnd] = useState("18:00");
  const [exceptionReason, setExceptionReason] = useState("");

  // Initialize from fetched data
  useEffect(() => {
    if (settings) {
      setMeetingDuration(settings.meeting_duration_minutes);
      setBuffer(settings.buffer_minutes);
    }
  }, [settings]);

  useEffect(() => {
    if (weeklyRanges.length > 0) {
      const grouped = DAYS.map((day) => {
        const dayRanges = weeklyRanges.filter((r) => r.day_of_week === day.value);
        return {
          dayOfWeek: day.value,
          isActive: dayRanges.some((r) => r.is_active),
          ranges: dayRanges.map((r) => ({
            start: r.start_time.substring(0, 5),
            end: r.end_time.substring(0, 5),
          })),
        };
      });
      setSchedule(grouped);
    } else {
      // Default schedule
      setSchedule(
        DAYS.map((day) => ({
          dayOfWeek: day.value,
          isActive: day.value >= 1 && day.value <= 5, // Mon-Fri active
          ranges: [{ start: "09:00", end: "18:00" }],
        }))
      );
    }
  }, [weeklyRanges]);

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, isActive: !d.isActive } : d
      )
    );
  };

  const handleAddRange = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, ranges: [...d.ranges, { start: "09:00", end: "18:00" }] }
          : d
      )
    );
  };

  const handleRemoveRange = (dayOfWeek: number, index: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, ranges: d.ranges.filter((_, i) => i !== index) }
          : d
      )
    );
  };

  const handleRangeChange = (
    dayOfWeek: number,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              ranges: d.ranges.map((r, i) =>
                i === index ? { ...r, [field]: value } : r
              ),
            }
          : d
      )
    );
  };

  const validateSchedule = (): boolean => {
    for (const day of schedule) {
      if (!day.isActive) continue;

      for (const range of day.ranges) {
        if (range.start >= range.end) {
          toast.error(`Rango inválido en ${DAYS.find((d) => d.value === day.dayOfWeek)?.label}: la hora de inicio debe ser menor a la hora de fin`);
          return false;
        }
      }

      // Check for overlapping ranges
      const sortedRanges = [...day.ranges].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        if (sortedRanges[i].end > sortedRanges[i + 1].start) {
          toast.error(`Rangos solapados en ${DAYS.find((d) => d.value === day.dayOfWeek)?.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateSchedule()) return;

    setIsSaving(true);
    try {
      await saveSettings.mutateAsync({
        professionalId,
        meetingDuration,
        buffer,
      });

      const allRanges = schedule.flatMap((day) =>
        day.ranges.map((range) => ({
          day_of_week: day.dayOfWeek,
          start_time: range.start,
          end_time: range.end,
          is_active: day.isActive,
        }))
      );

      await saveWeekly.mutateAsync({
        professionalId,
        ranges: allRanges,
      });

      toast.success("Configuración guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setMeetingDuration(60);
    setBuffer(0);
    setSchedule(
      DAYS.map((day) => ({
        dayOfWeek: day.value,
        isActive: day.value >= 1 && day.value <= 5,
        ranges: [{ start: "09:00", end: "18:00" }],
      }))
    );
    toast.info("Valores restaurados a predeterminados. Guarda para aplicar.");
  };

  const handleAddException = async () => {
    if (!exceptionDate) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (!exceptionAllDay && exceptionStart >= exceptionEnd) {
      toast.error("La hora de inicio debe ser menor a la hora de fin");
      return;
    }

    await addException.mutateAsync({
      professionalId,
      date: format(exceptionDate, "yyyy-MM-dd"),
      startTime: exceptionAllDay ? undefined : exceptionStart,
      endTime: exceptionAllDay ? undefined : exceptionEnd,
      allDay: exceptionAllDay,
      reason: exceptionReason || undefined,
    });

    setShowExceptionDialog(false);
    setExceptionDate(undefined);
    setExceptionAllDay(true);
    setExceptionStart("09:00");
    setExceptionEnd("18:00");
    setExceptionReason("");
  };

  const isLoading = loadingSettings || loadingRanges || loadingExceptions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone - Fixed */}
          <div className="flex items-center gap-4">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Zona Horaria</Label>
              <p className="text-sm text-muted-foreground">America/Santiago (UTC-3)</p>
            </div>
          </div>

          <Separator />

          {/* Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Duración de cita</Label>
              <Select
                value={String(meetingDuration)}
                onValueChange={(v) => setMeetingDuration(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Esta duración se usará para generar los slots disponibles.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Buffer entre citas</Label>
              <Select
                value={String(buffer)}
                onValueChange={(v) => setBuffer(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUFFER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tiempo de descanso entre citas consecutivas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Disponibilidad Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((day) => {
            const dayInfo = DAYS.find((d) => d.value === day.dayOfWeek);
            return (
              <div key={day.dayOfWeek} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={day.isActive}
                      onCheckedChange={() => handleToggleDay(day.dayOfWeek)}
                    />
                    <span className={`font-medium ${!day.isActive ? "text-muted-foreground" : ""}`}>
                      {dayInfo?.label}
                    </span>
                  </div>
                  {day.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddRange(day.dayOfWeek)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar rango
                    </Button>
                  )}
                </div>

                {day.isActive && (
                  <div className="ml-12 space-y-2">
                    {day.ranges.map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={range.start}
                          onChange={(e) =>
                            handleRangeChange(day.dayOfWeek, idx, "start", e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">a</span>
                        <Input
                          type="time"
                          value={range.end}
                          onChange={(e) =>
                            handleRangeChange(day.dayOfWeek, idx, "end", e.target.value)
                          }
                          className="w-32"
                        />
                        {day.ranges.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRange(day.dayOfWeek, idx)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Exceptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />
            Excepciones / Bloqueos
          </CardTitle>
          <Button onClick={() => setShowExceptionDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar bloqueo
          </Button>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay bloqueos configurados.
            </p>
          ) : (
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {format(new Date(exc.exception_date + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exc.all_day ? (
                        <Badge variant="secondary">Día completo</Badge>
                      ) : (
                        <span>
                          {exc.start_time?.substring(0, 5)} - {exc.end_time?.substring(0, 5)}
                        </span>
                      )}
                      {exc.reason && (
                        <span className="ml-2">• {exc.reason}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteException.mutate(exc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar cambios
        </Button>
        <Button variant="outline" onClick={handleResetDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar predeterminados
        </Button>
      </div>

      {/* Exception Dialog */}
      <Dialog open={showExceptionDialog} onOpenChange={setShowExceptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Bloqueo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {exceptionDate
                      ? format(exceptionDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exceptionDate}
                    onSelect={setExceptionDate}
                    disabled={(date) => date < new Date()}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={exceptionAllDay}
                onCheckedChange={setExceptionAllDay}
              />
              <Label>Bloquear día completo</Label>
            </div>

            {!exceptionAllDay && (
              <div className="flex items-center gap-2">
                <div className="space-y-1 flex-1">
                  <Label>Desde</Label>
                  <Input
                    type="time"
                    value={exceptionStart}
                    onChange={(e) => setExceptionStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <Label>Hasta</Label>
                  <Input
                    type="time"
                    value={exceptionEnd}
                    onChange={(e) => setExceptionEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ej: Vacaciones, día festivo..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExceptionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddException} disabled={addException.isPending}>
              {addException.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Agregar bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
