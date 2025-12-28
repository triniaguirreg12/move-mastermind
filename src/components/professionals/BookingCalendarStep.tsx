import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { format, addDays, isBefore, startOfDay, getDay, parse, addMinutes, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Professional, 
  AppointmentFormData,
  useProfessionalAvailability,
  useBookedSlots,
  useCreateAppointment,
  useGoogleCalendarBusySlots
} from "@/hooks/useProfessionals";
import { useFutureAvailabilityExceptions } from "@/hooks/useAvailability";
import { toast } from "sonner";

interface BookingCalendarStepProps {
  professional: Professional;
  formData: AppointmentFormData;
  onComplete: (date: Date, time: string, appointmentId: string) => void;
  onBack: () => void;
  onClose: () => void;
}

export function BookingCalendarStep({ 
  professional, 
  formData,
  onComplete, 
  onBack, 
  onClose 
}: BookingCalendarStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const { data: availability = [] } = useProfessionalAvailability(professional.id);
  const { data: exceptions = [] } = useFutureAvailabilityExceptions(professional.id);
  const createAppointment = useCreateAppointment();
  
  // Get dates for the next 30 days to check booked slots
  const dateRange = useMemo(() => {
    const dates: string[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      dates.push(format(addDays(today, i), 'yyyy-MM-dd'));
    }
    return dates;
  }, []);
  
  const { data: bookedSlots = [] } = useBookedSlots(professional.id, dateRange);

  // Get day availability for selected date to determine time range
  const selectedDayAvailability = useMemo(() => {
    if (!selectedDate || availability.length === 0) return null;
    const dayOfWeek = getDay(selectedDate);
    return availability.find(a => a.day_of_week === dayOfWeek) || null;
  }, [selectedDate, availability]);

  // Check Google Calendar busy slots for the selected date
  const { data: googleBusySlots = [], isLoading: isLoadingGoogleSlots } = useGoogleCalendarBusySlots(
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
    selectedDayAvailability?.start_time?.substring(0, 5) || '08:00',
    selectedDayAvailability?.end_time?.substring(0, 5) || '20:00'
  );

  // Get available days of week from availability
  const availableDaysOfWeek = useMemo(() => {
    return availability.map(a => a.day_of_week);
  }, [availability]);

  // Check if a date has an all-day exception
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return exceptions.some(ex => ex.exception_date === dateStr && ex.all_day);
  };

  // Get partial exceptions for a specific date
  const getDateExceptions = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return exceptions.filter(ex => ex.exception_date === dateStr && !ex.all_day);
  };

  // Disable dates that are not available, in the past, or blocked
  const disabledDates = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    
    // Check if this day of week has availability
    const dayOfWeek = getDay(date);
    if (!availableDaysOfWeek.includes(dayOfWeek)) return true;
    
    // Check if this specific date has an all-day block
    if (isDateBlocked(date)) return true;
    
    return false;
  };

  // Helper function to check if a time slot overlaps with a busy period
  const isSlotBusy = (slotTime: string, slotDuration: number): boolean => {
    if (!googleBusySlots || googleBusySlots.length === 0) return false;
    
    const slotStart = parse(slotTime, 'HH:mm', new Date());
    const slotEnd = addMinutes(slotStart, slotDuration);
    const slotStartMins = slotStart.getHours() * 60 + slotStart.getMinutes();
    const slotEndMins = slotEnd.getHours() * 60 + slotEnd.getMinutes();
    
    return googleBusySlots.some((busy: { start: string; end: string }) => {
      const busyStart = parse(busy.start, 'HH:mm', new Date());
      const busyEnd = parse(busy.end, 'HH:mm', new Date());
      const busyStartMins = busyStart.getHours() * 60 + busyStart.getMinutes();
      const busyEndMins = busyEnd.getHours() * 60 + busyEnd.getMinutes();
      
      // Check if there's any overlap
      return slotStartMins < busyEndMins && slotEndMins > busyStartMins;
    });
  };

  // Check if a time slot is blocked by a partial exception
  const isSlotBlockedByException = (slotTime: string, slotDuration: number): boolean => {
    if (!selectedDate) return false;
    
    const dateExceptions = getDateExceptions(selectedDate);
    if (dateExceptions.length === 0) return false;
    
    const slotStart = parse(slotTime, 'HH:mm', new Date());
    const slotEnd = addMinutes(slotStart, slotDuration);
    const slotStartMins = slotStart.getHours() * 60 + slotStart.getMinutes();
    const slotEndMins = slotEnd.getHours() * 60 + slotEnd.getMinutes();
    
    return dateExceptions.some(ex => {
      if (!ex.start_time || !ex.end_time) return false;
      
      const exStart = parse(ex.start_time.substring(0, 5), 'HH:mm', new Date());
      const exEnd = parse(ex.end_time.substring(0, 5), 'HH:mm', new Date());
      const exStartMins = exStart.getHours() * 60 + exStart.getMinutes();
      const exEndMins = exEnd.getHours() * 60 + exEnd.getMinutes();
      
      // Check if there's any overlap
      return slotStartMins < exEndMins && slotEndMins > exStartMins;
    });
  };

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || availability.length === 0) return [];
    
    const dayOfWeek = getDay(selectedDate);
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) return [];
    
    const slots: string[] = [];
    const startTime = parse(dayAvailability.start_time, 'HH:mm:ss', new Date());
    const endTime = parse(dayAvailability.end_time, 'HH:mm:ss', new Date());
    const slotDuration = dayAvailability.slot_duration_minutes;
    
    let currentSlot = startTime;
    while (isBefore(currentSlot, endTime)) {
      const slotEndTime = addMinutes(currentSlot, slotDuration);
      if (isBefore(slotEndTime, endTime) || format(slotEndTime, 'HH:mm') === format(endTime, 'HH:mm')) {
        slots.push(format(currentSlot, 'HH:mm'));
      }
      currentSlot = slotEndTime;
    }
    
    // Filter out already booked slots from database
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const bookedTimes = bookedSlots
      .filter(b => b.appointment_date === dateStr)
      .map(b => b.start_time.substring(0, 5));
    
    // Filter out database booked slots, Google Calendar busy slots, AND exception blocks
    return slots.filter(slot => {
      // Check if booked in database
      if (bookedTimes.includes(slot)) return false;
      // Check if busy in Google Calendar
      if (isSlotBusy(slot, slotDuration)) return false;
      // Check if blocked by exception
      if (isSlotBlockedByException(slot, slotDuration)) return false;
      return true;
    });
  }, [selectedDate, availability, bookedSlots, googleBusySlots, exceptions]);

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime) return;
    
    const dayOfWeek = getDay(selectedDate);
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    const slotDuration = dayAvailability?.slot_duration_minutes || 60;
    
    const startTime = parse(selectedTime, 'HH:mm', new Date());
    const endTime = addMinutes(startTime, slotDuration);
    
    try {
      const appointment = await createAppointment.mutateAsync({
        professional_id: professional.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime + ':00',
        end_time: format(endTime, 'HH:mm:ss'),
        form_data: formData
      });
      
      onComplete(selectedDate, selectedTime, appointment.id);
    } catch (error) {
      toast.error("Error al crear la cita. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm text-muted-foreground">Paso 2 de 3</span>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Selecciona fecha y hora
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Disponibilidad de {professional.name}
        </p>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto pb-32">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            disabled={disabledDates}
            locale={es}
            className="rounded-xl border border-border bg-card p-3 pointer-events-auto"
            fromDate={new Date()}
            toDate={addDays(new Date(), 30)}
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Clock className="w-4 h-4" />
              <span>Horarios disponibles para {format(selectedDate, "d 'de' MMMM", { locale: es })}</span>
            </div>
            
            {isLoadingGoogleSlots ? (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Consultando disponibilidad...</span>
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <Badge
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`cursor-pointer transition-all py-2 justify-center text-sm ${
                      selectedTime === time
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted border-border"
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay horarios disponibles para esta fecha
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-lg border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          La cita se confirma una vez realizado el pago.
        </p>
        <Button 
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime || createAppointment.isPending}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          {createAppointment.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creando cita...
            </>
          ) : (
            <>
              Continuar al pago
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
